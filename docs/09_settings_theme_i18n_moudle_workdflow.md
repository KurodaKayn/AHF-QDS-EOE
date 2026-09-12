# Settings, Theme & i18n Module Workflow

![Settings, Theme & i18n Data Flow](assets/09_settings_theme_i18n_moudle_workdflow.svg)

## Module Responsibilities

The Settings, Theme & i18n module manages user practice preferences, duplicate question detection settings, AI provider configuration entries, localization switching (English / Simplified Chinese), and color theme preferences (Light / Dark / System).

## Key Entry Points

- `src/app/quiz/settings/page.tsx` & `useSettingsPage.ts`: Main settings interface and co-located companion hook.
- `src/components/settings/AiConfigForm.tsx` & `useAiConfigForm.ts`: Modal form and companion validation hook for AI provider management.
- `src/model/quiz/quiz.store.ts`: Store state for practice, review, import, and AI settings (exposed via `@/model/quiz`).
- `src/model/theme/theme.store.ts`: Store state for visual theme mode (exposed via `@/model/theme`).
- `src/components/ThemeRegistry.tsx`: DOM synchronizer mapping theme state to root `<html>` classes and attributes.
- `src/i18n/config.ts`: i18next initialization, language detection, and storage persistence.
- `src/i18n/locales/*.json`: English and Chinese localization dictionaries.

## Data Flow

1. The settings view queries `settings` from `@/model/quiz`, `theme` from `@/model/theme`, and active locale from `useTranslation()`.
2. When the user updates practice or review options, `setQuizSetting()` updates `quizStore.settings`, serializing changes via Zustand persist.
3. Toggling theme preference updates `themeStore`, and `ThemeRegistry` synchronizes the `dark` class on the root document element.
4. Switching language invokes `i18n.changeLanguage()`, updating UI text instantly and persisting the preference in localStorage.
5. AI provider configurations leverage the synchronization bridge in `@/model/ai` to keep SQLite updated in desktop mode.
6. Downstream modules query these settings to determine question shuffling, automatic removal of resolved errors, and duplicate question thresholds.

## Maintenance Notes

- **Settings Defaults and Migration**: Baseline defaults are defined in `initialSettings` within `quiz.store.ts`. Schema migrations are governed in `quizStore.merge`.
- **Localization Key Parity**: New UI text must be added to both `zh.json` and `en.json`. Automated CI checks (`translations.test.ts`) statically verify that every referenced translation key exists in both locales.
- **Store Isolation**: Theme preferences are housed in an independent store (`@/model/theme`) to avoid unnecessary re-renders in quiz data consumers.
