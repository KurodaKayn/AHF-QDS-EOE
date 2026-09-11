# AHF QDS EOE 项目架构

![项目总体架构](assets/architecture.svg)

## 项目定位

AHF QDS EOE 是一个题库练习桌面应用。前端使用 Next.js 15、React 19、Tailwind CSS 和 Zustand；桌面端通过 Tauri 2 打包，Rust 后端负责 SQLite 持久化、AI 代理请求、题目解析和文件导入导出。Next 配置为静态导出，Tauri 加载 `out/` 目录中的页面。

## 顶层分层

| 层级                      | 主要文件                                                                                  | 职责                                                                |
| ------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 应用壳与全局 Provider     | `src/app/layout.tsx`, `src/components/Providers.tsx`, `src/app/quiz/layout.tsx`           | 全局 Provider、主题注册、桌面端启动同步、i18n 初始化、侧边栏和响应式布局 |
| 页面与纯展示 UI (.tsx)    | `src/app/quiz/**/page.tsx`, `src/components/**`                                           | 纯 UI 渲染与结构组织，不承载复杂 state、副作用和事件处理逻辑       |
| 同级业务 Hook (Co-located)| `src/app/quiz/**/use*.ts`, `src/components/**/use*.ts`                                    | 与对应页面/组件同级共存，封装业务流程、状态、副作用与事件处理      |
| 通用工具 Hook (Generic)   | `src/hooks/useMediaQuery.ts`, `src/hooks/useDebounce.ts`, `src/hooks/index.ts`            | 纯技术、业务无关的通用可复用 Hook                                  |
| 领域模型层 (Model)        | `src/model/quiz/**`, `src/model/ai/**`, `src/model/import-export/**`, `src/model/theme/**` | 领域契约、IPC 数据交互、领域状态管理、序列化、解析与判分规则        |
| 业务无关库 (Lib)          | `src/lib/array.ts`, `src/lib/id.ts`, `src/lib/string.ts`, `src/lib/runtime.ts` 等        | 纯工具函数、通用存储适配、跨平台运行时检测、Tailwind 样式工具       |
| Tauri 后端                | `src-tauri/src/*.rs`                                                                      | Rust command、SQLite 表结构、AI 代理、CSV/XLSX 处理和脚本解析       |
| 持久化与外部系统          | SQLite、localStorage、AI Provider、文件系统                                               | 运行时数据、设置、导入导出文件和大模型接口                          |

## 运行时分支

项目同时支持浏览器开发态和 Tauri 桌面态，因此多个模块都有运行时分支：

- 浏览器或开发态：题库和记录主要保存在 Zustand persist 的 `localStorage` 中；AI 请求由前端 `fetch` 直接访问 OpenAI-compatible `/chat/completions`。
- Tauri 桌面态：题库和记录通过 `@tauri-apps/api/core` 的 `invoke()` 调 Rust command；SQLite 位于 Tauri app data 目录。AI 配置写入 `ai_configs` 表，AI 请求由 Rust `reqwest` 发出，并通过 Tauri event 返回流式 chunk。
- 静态导出兼容：`next.config.ts` 使用 `output: "export"` 和 `trailingSlash: true`。题库管理页包含 `index.html` 兼容跳转和隐藏路由标记，服务于 Tauri 静态页面导航。

## 核心数据模型

核心类型定义在 `src/types/quiz.ts`（透明重导出自 `src/model/quiz/quiz.contract.ts`）：

- `QuestionType`：单选、多选、判断、简答、填空。
- `Question`：题干、选项、答案、解析、标签、创建和更新时间。
- `QuestionBank`：题库元数据和题目列表。
- `QuestionRecord`：用户答题记录、用户答案、正确性和答题时间。
- `AIConfig`：AI provider 的 base URL、API key 和 model，定义在 `src/model/ai/ai.contract.ts`。

Rust 侧在 `src-tauri/src/quiz.rs` 使用同构结构，并拆成 SQLite 表：`question_banks`、`questions`、`question_options`、`question_records`。AI 配置由 `src-tauri/src/ai.rs` 写入 `ai_configs`。

## 模块文档

下面的模块文档按实际代码边界拆分，每篇都包含数据流图：

- [应用壳模块](01_app_shell_moudle_workdflow.md)
- [题库数据模块](02_quiz_data_moudle_workdflow.md)
- [题库管理模块](03_bank_management_moudle_workdflow.md)
- [题目转换模块](04_conversion_moudle_workdflow.md)
- [练习模块](05_practice_moudle_workdflow.md)
- [错题复习模块](06_review_moudle_workdflow.md)
- [导入导出模块](07_import_export_moudle_workdflow.md)
- [AI 模块](08_ai_moudle_workdflow.md)
- [设置/主题/i18n 模块](09_settings_theme_i18n_moudle_workdflow.md)
- [Tauri 后端模块](10_tauri_backend_moudle_workdflow.md)

## 维护边界与依赖方向

- **单向依赖原则**：UI 逻辑保持在 `components/` 与 `app/`，UI 层可以导入 `model` 与 `lib`，但 `model` **严禁**导入 UI 组件。
- **纯粹的 Lib 层与 Hooks 层**：
  - `src/lib/` 保持完全业务无关（无任何题目、题库、AI 等具体业务概念），彻底废除原 `src/utils/`。
  - `src/hooks/` 仅存放完全业务无关的通用 Hook（如 `useMediaQuery`、`useDebounce`），禁止在此放置具体业务状态逻辑。
- **业务 Hook 同级协同 (Co-location)**：业务相关的 Hook（如 `usePracticeSession`、`useQuestionForm`、`useReviewLogic`）直接放置在对应页面或组件同级目录下。
- **.tsx 纯 UI 渲染原则**：所有 `.tsx` 文件仅关注组件组织和 UI 渲染，里面的状态定义、副作用（`useEffect`）与事件处理函数统一拆出为同级 companion hook。
- **自包含的 Model 架构**：各业务领域（`quiz`, `ai`, `import-export`, `theme`）在 `src/model/` 内部封装自己的 contract（契约）、api（后端 IPC 与网络通讯）、query/grader/parser 以及 store（状态）。模型之间可直接导入，无需 shared 中间层。
- `src-tauri/src/quiz.rs` 是桌面态题库数据的权威写入点；前端调用后使用返回的 snapshot 回填 Zustand。
- 导入导出和题目解析都有前端实现与 Rust 实现，改格式时要同步测试两边行为。
- AI 请求支持非流式转换和流式解析，流式场景依赖 Tauri event 名称 `ai-stream:chunk` 和 `ai-stream:done`。
