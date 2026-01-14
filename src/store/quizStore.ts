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
import { getPrompts, callAI } from "@/constants/ai";
import { createStorage } from "@/lib/storage";
import i18n from "@/i18n/config";

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

// Interface for Quiz Settings
export interface QuizSettings {
  shufflePracticeOptions: boolean;
  shuffleReviewOptions: boolean;
  shufflePracticeQuestionOrder: boolean;
  shuffleReviewQuestionOrder: boolean;
  markMistakeAsCorrectedOnReviewSuccess: boolean;

  // New AI Configs
  aiConfigs: AIConfig[];
  activeAiConfigId: string;

  // Toggle for duplicate question checking
  checkDuplicateQuestion: boolean;
}

export interface QuizState {
  questionBanks: QuestionBank[];
  records: QuestionRecord[];
  settings: QuizSettings;

  // Similarity feature states
  isSimilarQuestionsModalOpen: boolean;
  generatingSimilarQuestions: boolean;
  similarQuestionsList: Question[];
  selectedOriginalQuestionsForSimilarity: Question[];

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

  // Similarity feature actions
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

// Initial default AI configs
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
    name: "Qwen (Alibaba)",
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

  checkDuplicateQuestion: true,
};

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      questionBanks: [],
      records: [],
      settings: initialSettings,

      isSimilarQuestionsModalOpen: false,
      generatingSimilarQuestions: false,
      similarQuestionsList: [],
      selectedOriginalQuestionsForSimilarity: [],

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
        // Only check for duplicates if the setting is enabled
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
        // Add new question if it's not a duplicate
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

      // Similarity feature operations
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
          const { aiConfigs, activeAiConfigId } = get().settings;
          const config = aiConfigs.find((c) => c.id === activeAiConfigId);

          if (!config) {
            throw new Error(i18n.t("review.similarModal.errorNoConfig"));
          }

          if (!config.apiKey) {
            throw new Error(
              i18n.t("review.similarModal.errorNoApiKey", { name: config.name })
            );
          }

          const { baseUrl, apiKey, model } = config;

          // Prepare input: convert original questions to appropriate format
          const originalQuestionsData = originalQuestions.map((q) => {
            return {
              content: q.content,
              type: q.type,
              options: q.options,
              answer: q.answer,
              tags: q.tags || [],
            };
          });

          // Build messages
          const prompts = getPrompts(i18n.language);
          const messages = [
            { role: "system", content: prompts.similar },
            {
              role: "user",
              content: `${i18n.t(
                "review.similarModal.errorPrompt"
              )}\n${JSON.stringify(originalQuestionsData, null, 2)}`,
            },
          ];

          const response = await callAI(baseUrl, apiKey, model, messages);

          // Parse JSON from API response
          let generatedQuestionsData;
          try {
            // Try direct parse
            generatedQuestionsData = JSON.parse(response);
          } catch (e) {
            // Try extracting JSON block if direct parse fails
            const jsonMatch = response.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (jsonMatch) {
              try {
                generatedQuestionsData = JSON.parse(jsonMatch[0]);
              } catch (e2) {
                throw new Error(i18n.t("review.similarModal.errorParseFailed"));
              }
            } else {
              throw new Error(i18n.t("review.similarModal.errorNoJson"));
            }
          }

          if (!Array.isArray(generatedQuestionsData)) {
            throw new Error(i18n.t("review.similarModal.errorInvalidFormat"));
          }

          // Process returned data, adding necessary fields
          const processedQuestions: Question[] = generatedQuestionsData.map(
            (q: any) => {
              // Ensure options have IDs
              let processedOptions: QuestionOption[] = [];
              if (q.options && Array.isArray(q.options)) {
                processedOptions = q.options.map((opt: any) => {
                  if (!opt.id) {
                    return { ...opt, id: nanoid() };
                  }
                  return opt;
                });
              }

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
          alert(
            `${i18n.t("review.similarModal.importFailed")}: ${
              error instanceof Error ? error.message : "Unknown error"
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
            error: i18n.t("review.similarModal.importingBank"),
          };
        }

        for (const question of selectedQuestions) {
          const { id, ...questionData } = question;
          const result = addQuestionToBank(targetBankId, questionData);
          if (result.question) {
            importedCount++;
          } else if (result.isDuplicate) {
            skippedCount++;
          }
        }
        return { success: true, importedCount, skippedCount };
      },
    }),
    {
      name: "quiz-storage",
      storage: createJSONStorage(() => createStorage()),
      partialize: (state) => ({
        questionBanks: state.questionBanks,
        records: state.records,
        settings: state.settings,
        conversionState: state.conversionState,
        practiceSession: state.practiceSession,
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
          merged.settings = {
            ...initialSettings,
            ...(persistedState as QuizState).settings,
            aiConfigs:
              (persistedState as QuizState).settings.aiConfigs ||
              initialSettings.aiConfigs,
          };
        }

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
