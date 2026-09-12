# AI Module Workflow

![AI Data Flow](assets/08_ai_moudle_workdflow.svg)

## Module Responsibilities

The AI module manages OpenAI-compatible provider configurations and provides unified streaming and non-streaming inference capabilities for question conversion, error explanations, and similar-question synthesis.

## Key Entry Points

- `src/model/ai/ai.api.ts`: Core client functions `callAI()` and `callAIStream()`, along with backend synchronization bridges `syncAiConfigsToBackend()`, `saveAiConfigOnBackend()`, and `deleteAiConfigOnBackend()` (exposed via `@/model/ai`).
- `src/model/ai/ai.contract.ts`: Domain types and interfaces for `AIConfig` (exposed via `@/model/ai`).
- `src/model/quiz/quiz.store.ts`: Store state managing active provider selection and invoking `generateSimilarQuestions()`.
- `src/app/quiz/settings/page.tsx` & `src/components/settings/AiConfigForm.tsx`: AI provider settings interfaces and validation forms.
- `src-tauri/src/ai.rs`: Rust backend SQLite table `ai_configs` and outbound `reqwest` HTTP proxy engine.
- `src/constants/ai.ts`: Domain-tuned system prompts for conversion, explanation generation, and similar question generation.

## Data Flow

1. The user registers, tests, edits, or deletes an AI provider in the Settings page.
2. `quizStore` updates `settings.aiConfigs`. In the Tauri desktop runtime, it triggers `saveAiConfigOnBackend()` or `deleteAiConfigOnBackend()` to synchronize SQLite.
3. When an AI capability is triggered, `callAI()` or `callAIStream()` resolves the active provider configuration.
4. **Browser Mode**: The frontend executes a direct `fetch` POST to `<baseUrl>/chat/completions`.
5. **Tauri Desktop Mode**: The client invokes the Rust command `ai_complete`. Rust retrieves the matching configuration from `ai_configs` and executes the request through `reqwest`.
6. Non-streaming invocations resolve with the complete LLM response string. Streaming calls push incremental tokens to the frontend via window events (`ai-stream:chunk`, `ai-stream:done`).

## Maintenance Notes

- **Endpoint Normalization**: The AI invocation layer automatically appends `/chat/completions` if omitted from the `baseUrl`. Do not append this path manually in UI input fields.
- **Credential Storage**: In desktop mode, API keys are saved directly into the local SQLite `ai_configs` table, preventing exposure in web storage caches.
- **Unified Invocation Gateway**: All LLM interactions must flow exclusively through `callAI()` or `callAIStream()` to preserve unified logging, timeout policies, and desktop proxying.
