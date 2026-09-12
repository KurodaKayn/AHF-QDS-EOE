# Import / Export Module Workflow

![Import / Export Data Flow](assets/07_import_export_moudle_workdflow.svg)

## Module Responsibilities

The Import / Export module manages bidirectional file conversions for question banks in CSV and Excel (`.xlsx`) formats. It supports instantiating new question banks, merging questions into existing banks, and tracking duplicate question exclusions.

## Key Entry Points

- `src/app/quiz/import-export/page.tsx`: Import and export workbench UI.
- `src/app/quiz/import-export/useImportExport.ts`: Co-located companion business hook orchestrating file selection, mode toggling, progress feedback, and model execution.
- `src/model/import-export/import-export.api.ts`: Runtime adapter bridging file IO across browser and desktop environments (exposed via `@/model/import-export`).
- `src/model/import-export/import-export.serializer.ts`: Client-side CSV/XLSX serialization, deserialization, and tabular column mapping.
- `src-tauri/src/file_io.rs`: Desktop native Rust module handling CSV and XLSX byte streams.

## Data Flow

1. **Importing Files**: The user selects a `.csv` or `.xlsx` file and chooses an ingestion strategy (create a new bank or merge into an existing bank).
2. `useImportExport` invokes `importQuestionBank()` from `@/model/import-export`.
3. In browser mode, file data is read via `FileReader` and parsed via tabular libraries; in Tauri mode, binary file bytes are dispatched to the Rust backend command.
4. The service returns a transient `QuestionBank` instance. The companion hook creates a new bank or merges items into the chosen target bank.
5. Questions are persisted sequentially via `addQuestionToBank()`, allowing duplicate detection logic to tally skipped questions.
6. **Exporting Files**: The user selects a question bank and export format. In browser mode, an in-memory Blob triggers a browser download. In Tauri mode, the application invokes a native save file dialog and writes the bytes returned from the backend.

## Maintenance Notes

- **Column Contract**: The tabular column layout is fixed across serializers: `type`, `content`, `answer`, `explanation`, `tags`, followed by `optionA`, `optionB`, etc.
- **Dual Engine Parity**: Both TypeScript and Rust implement export and import serialization. Format enhancements must be reflected in both engines and verified using `import-export.serializer.test.ts`.
- **Granular Bank Insertion**: Importing records routes each question through `addQuestionToBank()`. This ensures consistent ID allocation, content normalization, and duplicate detection rather than performing an unverified bulk overwrite.
