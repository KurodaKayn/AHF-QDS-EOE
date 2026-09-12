# Practice Module Workflow

![Practice Data Flow](assets/05_practice_moudle_workdflow.svg)

## Module Responsibilities

The Practice module orchestrates both standard practice sessions and wrong-question review sessions: session initialization, question subset selection and shuffling, response tracking, answer validation and explanation reveal, question navigation, completion scoring, and history record persistence.

## Key Entry Points

- `src/app/quiz/practice/page.tsx`: Entry route for practice sessions.
- `src/components/quiz/practice/PracticeContent.tsx`: Pure presentational container organizing question cards, answer panels, and navigation controls.
- `src/components/quiz/practice/usePracticeSession.ts`: Co-located companion business hook managing session resumption, mode setup, response recording, and submission orchestration.
- `src/model/quiz/quiz.grader.ts`: Grading engine (`PracticeHandlers`), score calculation, and performance metrics (exposed via `@/model/quiz`).
- `src/components/quiz/practice/*`: Presentational components (card options, question index drawer, completion score summary, and question count selector).

## Data Flow

1. The user navigates to `/quiz/practice?bankId=...` (standard mode) or `/quiz/practice?bankId=...&mode=review` (review mode).
2. `usePracticeSession` loads question banks, historical records, user settings, and any persisted `practiceSession` from the store.
3. If an incomplete session matches the requested bank and mode, the session state is restored. Otherwise, a new practice set is constructed.
4. Standard mode prompts the user with a question quantity modal. Review mode identifies questions by cross-referencing past failed records.
5. User selections are recorded in `practiceSession.userAnswers`.
6. Upon question completion or exam submission, `PracticeHandlers.checkIsCorrect()` evaluates correctness and dispatches `addRecord()` to record the attempt in `@/model/quiz`.
7. In review mode, if the question is answered correctly and auto-removal is enabled in settings, `removeWrongRecordsByQuestionId()` clears earlier failure records.

## Maintenance Notes

- **Persistent Session State**: Active session state survives navigation and page reloads via Zustand persist. Schema changes to session entities must handle legacy state hydration gracefully.
- **Centralized Evaluation Engine**: Answer checking and scoring algorithms are centralized in `PracticeHandlers` (`quiz.grader.ts`). Adding new question types requires expanding unit test suites in `quiz.grader.test.ts`.
- **Review Mode Cross-Referencing**: Wrong question review dynamically filters the global record store against the selected bank ID. Verify this reverse-lookup integrity whenever modifying question or record schemas.
