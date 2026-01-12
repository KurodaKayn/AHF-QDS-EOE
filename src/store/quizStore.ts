import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  Question,
  QuestionBank,
  QuestionRecord,
  QuestionType,
  QuestionOption,
} from "@/types/quiz";
import { nanoid } from "nanoid";
import { SIMILAR_QUESTIONS_PROMPT, callAI } from "@/constants/ai";
import { createStorage } from "@/lib/storage";

// AI Config Interface
export interface AIConfig {
  id: string;
  name: string;
  type: "preset" | "custom";
  provider?: "deepseek" | "alibaba"; // Specific for presets to show logos/helper text
  baseUrl: string;
  apiKey: string;
  model: string;
}

// 定义设置的接口
export interface QuizSettings {
  shufflePracticeOptions: boolean;
  shuffleReviewOptions: boolean;
  shufflePracticeQuestionOrder: boolean;
  shuffleReviewQuestionOrder: boolean;
  markMistakeAsCorrectedOnReviewSuccess: boolean;

  // New AI Configs
  aiConfigs: AIConfig[];
  activeAiConfigId: string;

  // 新增：题目查重开关
  checkDuplicateQuestion: boolean;
}

export interface QuizState {
  questionBanks: QuestionBank[];
  records: QuestionRecord[];
  settings: QuizSettings; // 设置状态，包括AI提供商配置

  // >>> 新增状态，用于相似题目功能
  isSimilarQuestionsModalOpen: boolean;
  generatingSimilarQuestions: boolean;
  similarQuestionsList: Question[];
  selectedOriginalQuestionsForSimilarity: Question[];
  // <<< 新增状态结束

  addQuestionBank: (name: string, description?: string) => QuestionBank;
  getQuestionBankById: (id: string) => QuestionBank | undefined;
  updateQuestionBank: (id: string, name: string, description?: string) => void;
  deleteQuestionBank: (id: string) => void;
  addQuestionToBank: (
    bankId: string,
    question: Omit<Question, "id">
  ) => { question: Question | null; isDuplicate: boolean };
  updateQuestionInBank: (
    bankId: string,
    questionId: string,
    questionData: Partial<Omit<Question, "id">>
  ) => Question | null;
  deleteQuestionFromBank: (bankId: string, questionId: string) => void;
  getQuestionById: (
    questionId: string
  ) => { question: Question; bank: QuestionBank } | undefined;
  addRecord: (record: Omit<QuestionRecord, "id">) => void;
  clearRecords: (bankId?: string) => void;
  removeWrongRecordsByQuestionId: (questionIdToRemove: string) => void;

  // Common Settings Actions
  setQuizSetting: <K extends keyof QuizSettings>(
    key: K,
    value: QuizSettings[K]
  ) => void;
  resetQuizSettings: () => void;

  // AI Config Management Actions
  addAiConfig: (config: Omit<AIConfig, "id">) => void;
  updateAiConfig: (id: string, config: Partial<AIConfig>) => void;
  deleteAiConfig: (id: string) => void;
  setActiveAiConfig: (id: string) => void;

  // >>> 新增操作，用于相似题目功能
  toggleSimilarQuestionsModal: (isOpen?: boolean) => void;
  setSelectedOriginalQuestionsForSimilarity: (questions: Question[]) => void;
  generateSimilarQuestions: (originalQuestions: Question[]) => Promise<void>;
  importGeneratedQuestions: (
    selectedQuestions: Question[],
    targetBankId: string
  ) => Promise<{
    success: boolean;
    importedCount: number;
    skippedCount: number;
    error?: string;
  }>;
  // <<< 新增操作结束

  // Conversion State Persistence
  conversionState: {
    inputText: string;
    mode: "ai" | "script";
    scriptTemplate: string;
    generatedQuestions: Question[];
    isConverting: boolean;
  };
  setConversionState: (state: Partial<QuizState["conversionState"]>) => void;

  // Practice Session State Persistence
  practiceSession: {
    bankId: string | null;
    mode: "normal" | "review" | null;
    practiceQuestions: (Question & {
      originalUserAnswer?: string | string[];
    })[];
    currentQuestionIndex: number;
    userAnswers: Record<string, string | string[]>;
    showAnswer: boolean;
    quizCompleted: boolean;
    startTime: number | null;
  };
  setPracticeSession: (state: Partial<QuizState["practiceSession"]>) => void;
  clearPracticeSession: () => void;
}

// 初始设置
const defaultAiConfigs: AIConfig[] = [
  {
    id: "deepseek-default",
    name: "DeepSeek",
    type: "preset",
    provider: "deepseek",
    baseUrl: "https://api.deepseek.com/v1",
    apiKey: "",
    model: "deepseek-chat",
  },
  {
    id: "alibaba-default",
    name: "通义千问",
    type: "preset",
    provider: "alibaba",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    apiKey: "",
    model: "qwen-turbo",
  },
];

const initialSettings: QuizSettings = {
  shufflePracticeOptions: false,
  shuffleReviewOptions: false,
  shufflePracticeQuestionOrder: false,
  shuffleReviewQuestionOrder: false,
  markMistakeAsCorrectedOnReviewSuccess: true,

  aiConfigs: defaultAiConfigs,
  activeAiConfigId: "deepseek-default",

  // 新增
  checkDuplicateQuestion: true,
};

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      questionBanks: [],
      records: [],
      settings: initialSettings, // 初始化设置

      // >>> 初始化新增状态
      isSimilarQuestionsModalOpen: false,
      generatingSimilarQuestions: false,
      similarQuestionsList: [],
      selectedOriginalQuestionsForSimilarity: [],
      // <<< 初始化新增状态结束

      conversionState: {
        inputText: "",
        mode: "ai",
        scriptTemplate: "chaoxing",
        generatedQuestions: [],
        isConverting: false,
      },
      setConversionState: (newState) => {
        set((state) => ({
          conversionState: { ...state.conversionState, ...newState },
        }));
      },

      practiceSession: {
        bankId: null,
        mode: null,
        practiceQuestions: [],
        currentQuestionIndex: 0,
        userAnswers: {},
        showAnswer: false,
        quizCompleted: false,
        startTime: null,
      },
      setPracticeSession: (newState) => {
        set((state) => ({
          practiceSession: { ...state.practiceSession, ...newState },
        }));
      },
      clearPracticeSession: () => {
        set({
          practiceSession: {
            bankId: null,
            mode: null,
            practiceQuestions: [],
            currentQuestionIndex: 0,
            userAnswers: {},
            showAnswer: false,
            quizCompleted: false,
            startTime: null,
          },
        });
      },

      addQuestionBank: (name, description = "") => {
        const newBank: QuestionBank = {
          id: nanoid(),
          name,
          description,
          questions: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({ questionBanks: [...state.questionBanks, newBank] }));
        return newBank;
      },
      getQuestionBankById: (id) =>
        get().questionBanks.find((bank) => bank.id === id),
      updateQuestionBank: (id, name, description) => {
        set((state) => ({
          questionBanks: state.questionBanks.map((bank) =>
            bank.id === id
              ? {
                  ...bank,
                  name,
                  description: description ?? bank.description,
                  updatedAt: Date.now(),
                }
              : bank
          ),
        }));
      },
      deleteQuestionBank: (id) => {
        set((state) => ({
          questionBanks: state.questionBanks.filter((bank) => bank.id !== id),
          records: state.records.filter((record) => {
            const questionBank = state.questionBanks.find((qb) =>
              qb.questions.some((q) => q.id === record.questionId)
            );
            return questionBank ? questionBank.id !== id : true;
          }),
        }));
      },
      addQuestionToBank: (bankId, questionData) => {
        const bank = get().getQuestionBankById(bankId);
        if (!bank) {
          return { question: null, isDuplicate: false };
        }
        // 只有开启查重时才查重
        const checkDuplicate = get().settings.checkDuplicateQuestion;
        let duplicateQuestion = undefined;
        if (checkDuplicate) {
          duplicateQuestion = bank.questions.find(
            (q) => q.content.trim() === questionData.content.trim()
          );
        }
        if (duplicateQuestion) {
          return { question: null, isDuplicate: true };
        }
        // 不存在重复，添加新题目
        const newQuestion: Question = { ...questionData, id: nanoid() };
        let updatedBank: QuestionBank | undefined;
        set((state) => ({
          questionBanks: state.questionBanks.map((bank) => {
            if (bank.id === bankId) {
              updatedBank = {
                ...bank,
                questions: [...bank.questions, newQuestion],
                updatedAt: Date.now(),
              };
              return updatedBank;
            }
            return bank;
          }),
        }));
        return {
          question: updatedBank ? newQuestion : null,
          isDuplicate: false,
        };
      },
      updateQuestionInBank: (bankId, questionId, questionData) => {
        let updatedQuestion: Question | null = null;
        set((state) => ({
          questionBanks: state.questionBanks.map((bank) => {
            if (bank.id === bankId) {
              return {
                ...bank,
                questions: bank.questions.map((q) => {
                  if (q.id === questionId) {
                    updatedQuestion = { ...q, ...questionData, id: questionId };
                    return updatedQuestion;
                  }
                  return q;
                }),
                updatedAt: Date.now(),
              };
            }
            return bank;
          }),
        }));
        return updatedQuestion;
      },
      deleteQuestionFromBank: (bankId, questionId) => {
        set((state) => ({
          questionBanks: state.questionBanks.map((bank) =>
            bank.id === bankId
              ? {
                  ...bank,
                  questions: bank.questions.filter((q) => q.id !== questionId),
                  updatedAt: Date.now(),
                }
              : bank
          ),
          records: state.records.filter(
            (record) => record.questionId !== questionId
          ),
        }));
      },
      getQuestionById: (questionId) => {
        for (const bank of get().questionBanks) {
          const question = bank.questions.find((q) => q.id === questionId);
          if (question) {
            return { question, bank };
          }
        }
        return undefined;
      },
      addRecord: (record) => {
        const newRecord: QuestionRecord = { ...record, id: nanoid() };
        set((state) => ({ records: [...state.records, newRecord] }));
      },
      clearRecords: (bankId) => {
        if (bankId) {
          const bank = get().getQuestionBankById(bankId);
          if (!bank) return;
          const questionIdsInBank = bank.questions.map((q) => q.id);
          set((state) => ({
            records: state.records.filter(
              (r) => !questionIdsInBank.includes(r.questionId)
            ),
          }));
        } else {
          set({ records: [] });
        }
      },
      removeWrongRecordsByQuestionId: (questionIdToRemove) => {
        set((state) => ({
          records: state.records.filter(
            (record) =>
              !(record.questionId === questionIdToRemove && !record.isCorrect)
          ),
        }));
      },

      // Settings actions
      setQuizSetting: (key, value) => {
        set((state) => ({
          settings: {
            ...state.settings,
            [key]: value,
          },
        }));
      },
      resetQuizSettings: () => {
        set((state) => ({
          // Pass the current state to ensure other parts of the state are not affected
          ...state,
          settings: initialSettings,
        }));
      },

      // AI Config Actions
      addAiConfig: (config) => {
        const newConfig: AIConfig = { ...config, id: nanoid() };
        set((state) => ({
          settings: {
            ...state.settings,
            aiConfigs: [...state.settings.aiConfigs, newConfig],
            // If it's the first config and none is active, make it active (optional)
            activeAiConfigId: state.settings.activeAiConfigId || newConfig.id,
          },
        }));
      },
      updateAiConfig: (id, config) => {
        set((state) => ({
          settings: {
            ...state.settings,
            aiConfigs: state.settings.aiConfigs.map((c) =>
              c.id === id ? { ...c, ...config } : c
            ),
          },
        }));
      },
      deleteAiConfig: (id) => {
        set((state) => {
          const newConfigs = state.settings.aiConfigs.filter(
            (c) => c.id !== id
          );
          let newActiveId = state.settings.activeAiConfigId;
          // If we deleted the active config, pick the first one or empty string
          if (newActiveId === id) {
            newActiveId = newConfigs.length > 0 ? newConfigs[0].id : "";
          }
          return {
            settings: {
              ...state.settings,
              aiConfigs: newConfigs,
              activeAiConfigId: newActiveId,
            },
          };
        });
      },
      setActiveAiConfig: (id) => {
        set((state) => ({
          settings: {
            ...state.settings,
            activeAiConfigId: id,
          },
        }));
      },

      // >>> 实现新增操作
      toggleSimilarQuestionsModal: (isOpen) => {
        set((state) => ({
          isSimilarQuestionsModalOpen:
            isOpen === undefined ? !state.isSimilarQuestionsModalOpen : isOpen,
        }));
      },
      setSelectedOriginalQuestionsForSimilarity: (questions) => {
        set({ selectedOriginalQuestionsForSimilarity: questions });
      },
      generateSimilarQuestions: async (originalQuestions) => {
        set({
          generatingSimilarQuestions: true,
          similarQuestionsList: [],
          selectedOriginalQuestionsForSimilarity: originalQuestions,
        });
        if (!get().isSimilarQuestionsModalOpen) {
          set({ isSimilarQuestionsModalOpen: true });
        }

        try {
          // 获取当前激活的AI配置
          const { aiConfigs, activeAiConfigId } = get().settings;
          const config = aiConfigs.find((c) => c.id === activeAiConfigId);

          if (!config) {
            throw new Error("未找到激活的AI配置，请在设置中选择一个AI模型。");
          }

          if (!config.apiKey) {
            throw new Error(`请先在设置中配置 ${config.name} 的 API Key。`);
          }

          const { baseUrl, apiKey, model } = config;

          // 准备输入数据：将原题转换为适当格式
          const originalQuestionsData = originalQuestions.map((q) => {
            return {
              content: q.content,
              type: q.type,
              options: q.options,
              answer: q.answer,
              tags: q.tags || [],
            };
          });

          // 构建消息
          const messages = [
            { role: "system", content: SIMILAR_QUESTIONS_PROMPT },
            {
              role: "user",
              content: `请基于以下题目生成相似题目：\n${JSON.stringify(
                originalQuestionsData,
                null,
                2
              )}`,
            },
          ];

          const response = await callAI(baseUrl, apiKey, model, messages);

          // 解析API返回的JSON
          let generatedQuestionsData;
          try {
            // 尝试直接解析返回的内容为JSON
            generatedQuestionsData = JSON.parse(response);
          } catch (e) {
            // 如果直接解析失败，尝试从返回的文本中提取JSON部分
            const jsonMatch = response.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (jsonMatch) {
              try {
                generatedQuestionsData = JSON.parse(jsonMatch[0]);
              } catch (e2) {
                throw new Error("无法解析AI返回的数据");
              }
            } else {
              throw new Error("AI返回的数据不包含有效的JSON");
            }
          }

          if (!Array.isArray(generatedQuestionsData)) {
            throw new Error("AI返回的数据格式不正确，应为题目数组");
          }

          // 处理返回的题目数据，补充必要的字段
          const processedQuestions: Question[] = generatedQuestionsData.map(
            (q: any) => {
              // 确保选项有ID
              let processedOptions: QuestionOption[] = [];
              if (q.options && Array.isArray(q.options)) {
                processedOptions = q.options.map((opt: any, idx: number) => {
                  // 如果选项没有ID，生成一个
                  if (!opt.id) {
                    return { ...opt, id: nanoid() };
                  }
                  return opt;
                });
              }

              // 填充完整的题目对象
              return {
                id: nanoid(),
                content: q.content,
                type: q.type,
                options: processedOptions,
                answer: q.answer,
                explanation: q.explanation || "",
                tags: q.tags || [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
              };
            }
          );

          set({
            similarQuestionsList: processedQuestions,
            generatingSimilarQuestions: false,
          });
        } catch (error) {
          // 出错时显示一个提示，并重置状态
          alert(
            `生成相似题目失败: ${
              error instanceof Error ? error.message : "未知错误"
            }`
          );
          set({
            similarQuestionsList: [],
            generatingSimilarQuestions: false,
          });
        }
      },
      importGeneratedQuestions: async (selectedQuestions, targetBankId) => {
        const { addQuestionToBank, getQuestionBankById } = get();
        let importedCount = 0;
        let skippedCount = 0;

        if (!getQuestionBankById(targetBankId)) {
          return {
            success: false,
            importedCount,
            skippedCount,
            error: "目标题库不存在",
          };
        }

        for (const question of selectedQuestions) {
          const { id, ...questionData } = question; // id is not needed for addQuestionToBank
          const result = addQuestionToBank(targetBankId, questionData);
          if (result.question) {
            importedCount++;
          } else if (result.isDuplicate) {
            skippedCount++;
          } else {
            // 导入失败但非重复
          }
        }
        return { success: true, importedCount, skippedCount };
      },
      // <<< 实现新增操作结束
    }),
    {
      name: "quiz-storage",
      storage: createJSONStorage(() => createStorage()),
      partialize: (state) => ({
        questionBanks: state.questionBanks,
        records: state.records,
        settings: state.settings,
        conversionState: state.conversionState, // Persist conversion state
        practiceSession: state.practiceSession, // Persist practice session state
      }),
      merge: (persistedState, currentState) => {
        const merged = {
          ...currentState,
          ...(persistedState as Partial<QuizState>),
        };

        // Migration Logic: If old settings exist but no aiConfigs, migrate them.
        const persisted = persistedState as any;
        if (persisted && persisted.settings && !persisted.settings.aiConfigs) {
          const oldSettings = persisted.settings;
          const newConfigs: AIConfig[] = [];

          // Migrate Deepseek if key existed
          if (oldSettings.deepseekApiKey) {
            newConfigs.push({
              id: "migrated-deepseek",
              name: "DeepSeek (Migrated)",
              type: "preset",
              provider: "deepseek",
              baseUrl:
                oldSettings.deepseekBaseUrl || "https://api.deepseek.com/v1",
              apiKey: oldSettings.deepseekApiKey,
              model: "deepseek-chat",
            });
          }

          // Migrate Alibaba if key existed
          if (oldSettings.alibabaApiKey) {
            newConfigs.push({
              id: "migrated-alibaba",
              name: "Alibaba (Migrated)",
              type: "preset",
              provider: "alibaba",
              baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
              apiKey: oldSettings.alibabaApiKey,
              model: "qwen-turbo",
            });
          }

          // Ensure we have default configs if nothing migrated or in addition
          // Actually, if we have migrated something, we use it. If not, we use defaults.
          // If we migrate, we should likely keep default empty ones too if user wants?
          // No, cleaner to just use what we have or fall back to defaults.

          const finalConfigs =
            newConfigs.length > 0 ? newConfigs : defaultAiConfigs;
          let activeId = finalConfigs[0].id;

          if (
            oldSettings.aiProvider === "alibaba" &&
            newConfigs.find((c) => c.provider === "alibaba")
          ) {
            activeId = newConfigs.find((c) => c.provider === "alibaba")!.id;
          } else if (
            oldSettings.aiProvider === "deepseek" &&
            newConfigs.find((c) => c.provider === "deepseek")
          ) {
            activeId = newConfigs.find((c) => c.provider === "deepseek")!.id;
          }

          merged.settings = {
            ...initialSettings,
            ...oldSettings,
            aiConfigs: finalConfigs,
            activeAiConfigId: activeId,
          };
        } else if (!(persistedState as QuizState)?.settings) {
          merged.settings = initialSettings;
        } else {
          // Standard merge for existing new structure
          merged.settings = {
            ...initialSettings,
            ...(persistedState as QuizState).settings,
            // Ensure aiConfigs is not undefined if something weird happened
            aiConfigs:
              (persistedState as QuizState).settings.aiConfigs ||
              initialSettings.aiConfigs,
          };
        }

        // Merge conversionState if exists
        // 'persisted' is already declared above for migration logic
        if (persisted.conversionState) {
          merged.conversionState = {
            ...currentState.conversionState,
            ...persisted.conversionState,
          };
        }

        return merged;
      },
    }
  )
);
