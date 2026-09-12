# Application Shell Module Workflow

![Application Shell Data Flow](assets/01_app_shell_moudle_workdflow.svg)

## Module Responsibilities

The Application Shell module integrates Next.js routing, global context providers, theme registry, internationalization, notification toasts, and the quiz workspace navigation shell. It does not manipulate quiz business logic directly; instead, it establishes the operational runtime and shared context required by all downstream pages.

## Key Entry Points

- `src/app/page.tsx`: Root path redirecting immediately to `/quiz`.
- `src/app/layout.tsx`: Root HTML layout loading typography, global styles, and mounting `Providers`.
- `src/components/Providers.tsx` & `useStartupSync.ts`: Initializes i18n, themes, and `sonner` toast notifications, orchestrating desktop startup sync (AI configurations and SQLite quiz snapshot) under Tauri runtime.
- `src/app/quiz/layout.tsx` & `useQuizLayout.ts`: Provides the persistent desktop sidebar, mobile navigation drawer, and responsive layout shell.

## Data Flow

1. When the user opens the application, the root path `/` redirects to `/quiz`.
2. `RootLayout` renders the client-side `Providers`, deferring execution until client hydration finishes to eliminate SSR/CSR hydration mismatches.
3. `Providers` initializes `ThemeRegistry`, the notification `Toaster`, and triggers `useStartupSync`:
   - Under the Tauri desktop runtime, AI configuration entries are synchronized to the Rust SQLite database, and the latest quiz database snapshot is loaded (or initialized) into Zustand.
4. Pages located under `/quiz/*` receive consistent visual structure, top-level branding, and responsive navigation controls via `QuizLayout`.
5. Individual feature pages consume `@/model/quiz`, `@/model/theme`, and i18n hooks to render content.

## Maintenance Notes

- **Tauri Snapshot Sync Safety**: The startup sync executed in `useStartupSync` directly controls quiz data initialization. Any modifications to this logic must verify that existing user data in SQLite is never unintentionally overwritten.
- **Dual Navigation State**: `QuizLayout` manages separate states for desktop sidebar links and mobile drawer overlays. Any added routes must be registered in `navItems`.
- **Static Export Constraints**: Next.js operates in full static export mode (`output: "export"`). Shell layouts must not rely on runtime Node.js server APIs or dynamic server-rendered headers.
