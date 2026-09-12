# Question Conversion Module Workflow

![Question Conversion Data Flow](assets/04_conversion_moudle_workdflow.svg)

## Module Responsibilities

The Question Conversion module converts raw text—sourced from clipboard pasting, client-side OCR extraction, LLM generation, or structured script formats—into standardized `Question[]` domain collections ready to be saved into new or existing question banks.

## Key Entry Points

- `src/app/quiz/convert/page.tsx` & `useConvertPage.ts`: Conversion workbench UI and co-located companion hook.
- `src/app/quiz/convert/useConversionLogic.ts`: Co-located companion business hook orchestrating AI parsing, script template parsing, and bank persistence workflows.
- `src/components/quiz/ImageOCRUpload.tsx` & `useImageOCRUpload.ts`: Tesseract.js OCR integration component and extraction hook.
- `src/model/quiz/quiz.parser.ts`: Heuristic and regex parser for unstructured AI generation outputs (exposed via `@/model/quiz`).
- `src/model/quiz/quiz.scriptParser.ts`: Deterministic parser for structured question scripts (ChaoXing, General, Single Choice formats).
- `src/constants/ai.ts` & `src/constants/scriptExamples.ts`: Conversion system prompts, user templates, and format syntax examples.

## Data Flow

1. The user inputs raw text manually or extracts text from an uploaded image or clipboard screenshot via Tesseract OCR.
2. `ConvertPage` saves working drafts to `conversionState` in the store to safeguard against accidental route departures.
3. **AI Conversion Path**: `useConversionLogic` dispatches `callAI()` from `@/model/ai`, then passes the raw text output into `parseQuestions()` from `@/model/quiz`.
4. **Script Template Path**: The input text is processed deterministically by `parseTextByScript()` matching the chosen script grammar.
5. In the Tauri desktop runtime, parsing routines can be offloaded to `src-tauri/src/question_parsing.rs`; browser mode runs the TypeScript implementation.
6. The user previews, verifies, and edits the converted questions. `SaveToBankForm` then commits the collection to a designated bank using domain actions from `@/model/quiz`.

## Maintenance Notes

- **AI Parser Sensitivity**: Parsing heuristics depend closely on markdown code fencing and prompt formatting. Any prompt modifications in `src/constants/ai.ts` must be validated against `quiz.parser.test.ts`.
- **Dual Script Parser Synchronization**: Script parsing logic is implemented in both TypeScript and Rust. Adding or altering template syntax requires updating and testing both engines.
- **Separation of OCR Pipeline**: OCR exclusively outputs raw extracted strings; it must never produce domain entities directly. All extracted text flows through either the AI or script parsing pipeline.
