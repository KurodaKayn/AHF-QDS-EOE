# Wrong Question Review Module Workflow

![Wrong Question Review Data Flow](assets/06_review_moudle_workdflow.svg)

## Module Responsibilities

The Wrong Question Review module aggregates incorrect answers from practice history records into an actionable review workspace. It supports multi-criteria filtering, keyword search, batch selection, real-time streaming AI explanation generation, AI similar-question synthesis, target bank importation, and quick launches into review practice sessions.

## Key Entry Points

- `src/app/quiz/review/page.tsx` & `useReviewPage.ts`: Review dashboard view and co-located companion hook.
- `src/app/quiz/review/useReviewLogic.ts`: Co-located companion business hook managing question bank filtering, keyword searching, and batch selection state.
- `src/app/quiz/review/useAiExplanation.ts`: Co-located companion business hook driving streaming AI explanation generation.
- `src/components/quiz/WrongQuestionItem.tsx`: Presentational component displaying question details, past wrong answers, and explanations.
- `src/components/quiz/SimilarQuestionsModal.tsx`: Dialog component for previewing and importing AI-generated similar questions.
- `src/app/quiz/review/practice/page.tsx` & `useReviewPracticeRedirect.ts`: Target redirect route and companion hook bridging into review practice sessions.

## Data Flow

1. The page retrieves `questionBanks` and `records` from `@/model/quiz`.
2. The review pipeline filters for records where `isCorrect === false`, joining on `questionId` to build enriched view models containing bank titles, user answers, and question prompts.
3. `useReviewLogic` evaluates bank filters and search keywords, producing the reactive `filteredQuestions` list.
4. Users can select items to trigger review practice sessions, generate AI explanations in batch, or synthesize similar questions.
5. AI explanation generation invokes `callAIStream()` from `@/model/ai`. Tokens stream reactively to the card UI and write back to the question's `explanation` property upon stream completion.
6. Similar question generation triggers `generateSimilarQuestions()` in `@/model/quiz`, parses the structured JSON payload, and allows users to import selected questions into any bank.
7. Record clearing dispatches `clearRecords()` through `@/model/quiz`, synchronizing across SQLite or `localStorage`.

## Maintenance Notes

- **Dynamic Materialization**: The review view is not a separate persisted database entity; it is derived at runtime by joining `records` with `questionBanks`.
- **Tauri Streaming Events**: Under desktop runtime, streaming AI explanations depend on the Tauri window events `ai-stream:chunk` and `ai-stream:done`.
- **Import Deduplication**: Importing generated similar questions routes through `addQuestionToBank()`, honoring user-configured duplicate question thresholds.
