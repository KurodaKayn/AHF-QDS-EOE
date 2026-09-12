# Quiz Data Module Workflow

![Quiz Data Flow](assets/02_quiz_data_moudle_workdflow.svg)

## Module Responsibilities

The Quiz Data module manages question banks, questions, practice history records, user settings, conversion drafts, and active practice sessions. It serves as the primary domain boundary between UI components and persistence mechanisms.

## Key Entry Points

- `src/model/quiz/quiz.store.ts`: Zustand store managing question banks, records, settings, conversion state, and practice sessions (exposed via `@/model/quiz`).
- `src/model/quiz/quiz.contract.ts`: Core domain entities, contracts, and type definitions (exposed via `@/model/quiz`).
- `src/model/quiz/quiz.api.ts`: Tauri IPC bridge responsible for executing Rust backend commands and retrieving `QuizSnapshot` objects.
- `src/model/quiz/quiz.query.ts`: Query utilities for duplicate question detection and search indexing.
- `src/lib/storage.ts`: Generic storage adapter used by Zustand persist middleware.

## Data Flow

1. Presentation components and companion hooks trigger bank or record operations through `useQuizStore` (or domain actions exported from `@/model/quiz`).
2. The store action evaluates the current execution environment (`isTauriRuntime()`).
3. **Browser / Development Mode**: Modifications update the in-memory Zustand state directly and are serialized to `localStorage` via the persist middleware.
4. **Tauri Desktop Mode**: Actions invoke Rust backend commands through `quiz.api.ts`. The Rust layer commits changes to SQLite and returns an updated, authoritative `QuizSnapshot`.
5. The frontend hydrates its `questionBanks` and `records` state with the returned snapshot, ensuring strict parity between UI state and the SQLite database.
6. Settings, conversion drafts, and active practice sessions persist via Zustand's storage adapter; in desktop mode, large bank entities are excluded from localStorage to optimize performance.

## Maintenance Notes

- **Schema Parity**: When introducing new domain fields to questions or banks, simultaneously update TypeScript contracts (`quiz.contract.ts`), Rust data structures (`src-tauri/src/quiz.rs`), SQLite migration routines, and import/export serializers.
- **Normalization Parity**: Duplicate question detection depends on `normalizeQuestionContent()` in TypeScript and `normalize_content()` in Rust. Deduplication rules across both sides must remain strictly aligned.
- **Authoritative Snapshots**: Returning full `QuizSnapshot` structures from backend mutations is foundational to UI state consistency. Avoid returning fragmented entities that require client-side extrapolation.
