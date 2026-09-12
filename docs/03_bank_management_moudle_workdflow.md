# Bank Management Module Workflow

![Bank Management Data Flow](assets/03_bank_management_moudle_workdflow.svg)

## Module Responsibilities

The Bank Management module handles the lifecycle of question banks (creation, selection, editing, deletion), question CRUD operations, sorting, filtering, duplicate question detection, and batch deletion.

## Key Entry Points

- `src/app/quiz/banks/manage/page.tsx` & `useManageBanksPage.ts`: Primary bank management view and co-located companion hook, containing routing compatibility logic for static exports.
- `src/app/quiz/banks/[bankId]/page.tsx` & `useBankDetailPage.ts`: Bank detail view and co-located companion hook for inspecting and modifying specific banks.
- `src/components/QuestionFormModal.tsx` & `src/components/useQuestionForm.ts`: Reusable question creation/editing modal and its companion form-state hook.
- `src/components/quiz/manage/*`: Modular management UI elements and companion hooks (`useBankDetailsCard.ts`, `useQuestionListSection.ts`, duplicate detection modal, deletion dialogs).

## Data Flow

1. The management page retrieves `questionBanks` from `@/model/quiz` and restores any active `bankId` from URL query parameters.
2. Upon selecting a bank, the view renders bank metadata alongside its paginated/filtered question collection.
3. When creating or editing a question, `QuestionFormModal` delegates input state, question type transitions, option list management, and validation logic to `useQuestionForm`.
4. Submitting the form dispatches `addQuestionToBank()` or `updateQuestionInBank()`.
5. Under Tauri desktop runtime, the Rust backend writes to SQLite and emits a refreshed snapshot back to Zustand; in browser mode, the Zustand store updates directly.
6. Duplicate question detection utilizes `findDuplicateQuestionsInBank()`, leveraging Rust's normalized SQLite index in desktop mode and in-memory Maps in browser mode.

## Maintenance Notes

- **Static Export Routing Compatibility**: The `index.html` fallback redirection and hidden navigation anchors in `src/app/quiz/banks/manage/page.tsx` are crucial for desktop webview static page navigation. Do not remove them without an alternative routing architecture.
- **Centralized Form Validation**: Validation logic for question options, correct answers, and required fields is concentrated in `useQuestionForm`. When supporting new question types, update this hook first.
- **Search Semantics Parity**: Desktop search queries leverage the Rust backend command `search_questions`. Query sanitization, case folding, and fuzzy matching behavior must match frontend client-side filtering.
