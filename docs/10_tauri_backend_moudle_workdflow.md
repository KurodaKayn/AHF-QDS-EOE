# Tauri Backend Module Workflow

![Tauri Backend Data Flow](assets/10_tauri_backend_moudle_workdflow.svg)

## Module Responsibilities

The Tauri Backend module provides the desktop application shell, plugin integrations, SQLite database lifecycle management, Rust command handlers, native file byte processing for imports/exports, outbound AI network proxying, and question parsing. It serves as the authoritative source of truth for persistent quiz data in desktop runtime.

## Key Entry Points

- `src-tauri/src/lib.rs`: Tauri application builder, plugin registration, application data path creation, and command routing.
- `src-tauri/src/quiz.rs`: Database operations for banks, questions, options, practice records, duplicate question indexing, search, and snapshot creation.
- `src-tauri/src/ai.rs`: `ai_configs` table schema management and `reqwest` HTTP streaming proxy.
- `src-tauri/src/file_io.rs`: Native CSV and Excel (`.xlsx`) byte-level serialization and parsing.
- `src-tauri/src/question_parsing.rs`: Rust implementations for AI output parsing and structured script format parsing.
- `src-tauri/tauri.conf.json`: Window configurations, bundle identifiers, security capabilities, and static asset paths (`../out`).

## Data Flow

1. On application launch, Tauri initializes the application data directory (`app_data_dir`) and logging infrastructure.
2. `ai::initialize_database()` and `quiz::initialize_database()` verify and create tables, indices, and column migrations within `quiz.db`.
3. The frontend invokes registered Rust commands via `@tauri-apps/api/core`'s `invoke()`.
4. Bank and question mutation commands execute within SQLite transactions and return a complete `QuizSnapshot`.
5. AI commands retrieve target provider credentials from `ai_configs`, issue outbound requests via `reqwest`, and stream response chunks through window events.
6. File IO commands receive raw binary buffers from the frontend, parse or generate CSV/XLSX streams, and return output bytes.
7. Question parsing commands process raw text strings against script grammar rules, returning structured `Question[]` arrays to the UI.

## Maintenance Notes

- **Idempotent SQLite Migrations**: Database initialization is idempotent. When adding new columns (such as `normalized_content`), provide migration guards that check table pragma metadata before altering tables.
- **IPC Command String Identifiers**: Tauri command names are invoked via string literals in frontend TypeScript code (`quiz.api.ts`, `ai.api.ts`). Renaming commands requires synchronized updates across both codebases.
- **State Snapshot Contract**: Returning full `QuizSnapshot` objects on every mutation command in `quiz.rs` ensures the frontend Zustand store remains an exact reflection of SQLite.
- **Static Export Coupling**: `frontendDist` (`../out`), `devUrl`, and `beforeBuildCommand` in `tauri.conf.json` are tightly bound to Next.js static output settings.
