import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Question, QuestionBank, QuestionRecord, QuestionType } from '@/types/quiz';
import { v4 as uuidv4 } from 'uuid';

// 定义设置的接口
export interface QuizSettings {
  shufflePracticeOptions: boolean;
  shuffleReviewOptions: boolean;
  shufflePracticeQuestionOrder: boolean;
  shuffleReviewQuestionOrder: boolean;
  markMistakeAsCorrectedOnReviewSuccess: boolean;

  // 新的AI提供商设置
  aiProvider: 'deepseek' | 'alibaba';
  deepseekApiKey: string;
  deepseekBaseUrl: string; // 例如：https://api.deepseek.com
  alibabaApiKey: string;
  // 新增：题目查重开关
  checkDuplicateQuestion: boolean;
  // 阿里巴巴基础URL是固定的："https://dashscope.aliyuncs.com/compatible-mode/v1"
  // 阿里巴巴模型可以在这里存储，例如：qwenModel: string;
}

export interface QuizState {
  questionBanks: QuestionBank[];
  records: QuestionRecord[];
  settings: QuizSettings; // 设置状态，包括AI提供商配置

  // ... (其他状态)
  addQuestionBank: (name: string, description?: string) => QuestionBank;
  getQuestionBankById: (id: string) => QuestionBank | undefined;
  updateQuestionBank: (id: string, name: string, description?: string) => void;
  deleteQuestionBank: (id: string) => void;
  addQuestionToBank: (bankId: string, question: Omit<Question, 'id'>) => { question: Question | null; isDuplicate: boolean };
  updateQuestionInBank: (bankId: string, questionId: string, questionData: Partial<Omit<Question, 'id'>>) => Question | null;
  deleteQuestionFromBank: (bankId: string, questionId: string) => void;
  getQuestionById: (questionId: string) => { question: Question, bank: QuestionBank } | undefined;
  addRecord: (record: Omit<QuestionRecord, 'id'>) => void;
  clearRecords: (bankId?: string) => void;
  removeWrongRecordsByQuestionId: (questionIdToRemove: string) => void;
  
  // 通用设置操作
  setQuizSetting: <K extends keyof QuizSettings>(key: K, value: QuizSettings[K]) => void;
  resetQuizSettings: () => void;
}

// 初始设置
const initialSettings: QuizSettings = {
  shufflePracticeOptions: false,
  shuffleReviewOptions: false,
  shufflePracticeQuestionOrder: false,
  shuffleReviewQuestionOrder: false,
  markMistakeAsCorrectedOnReviewSuccess: true,

  // AI提供商默认值
  aiProvider: 'deepseek',
  deepseekApiKey: '',
  deepseekBaseUrl: 'https://api.deepseek.com', // 默认为常用公共API
  alibabaApiKey: '',
  // 新增
  checkDuplicateQuestion: true,
};

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      questionBanks: [],
      records: [],
      settings: initialSettings, // 初始化设置

      addQuestionBank: (name, description = '') => {
        const newBank: QuestionBank = { id: uuidv4(), name, description, questions: [], createdAt: Date.now(), updatedAt: Date.now() };
        set((state) => ({ questionBanks: [...state.questionBanks, newBank] }));
        return newBank;
      },
      getQuestionBankById: (id) => get().questionBanks.find(bank => bank.id === id),
      updateQuestionBank: (id, name, description) => {
        set((state) => ({
          questionBanks: state.questionBanks.map(bank =>
            bank.id === id ? { ...bank, name, description: description ?? bank.description, updatedAt: Date.now() } : bank
          ),
        }));
      },
      deleteQuestionBank: (id) => {
        set((state) => ({
          questionBanks: state.questionBanks.filter(bank => bank.id !== id),
          records: state.records.filter(record => {
            const questionBank = state.questionBanks.find(qb => qb.questions.some(q => q.id === record.questionId));
            return questionBank ? questionBank.id !== id : true;
          })
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
            q => q.content.trim() === questionData.content.trim()
          );
        }
        if (duplicateQuestion) {
          return { question: null, isDuplicate: true };
        }
        // 不存在重复，添加新题目
        const newQuestion: Question = { ...questionData, id: uuidv4() };
        let updatedBank: QuestionBank | undefined;
        set((state) => ({
          questionBanks: state.questionBanks.map(bank => {
            if (bank.id === bankId) {
              updatedBank = { 
                ...bank, 
                questions: [...bank.questions, newQuestion], 
                updatedAt: Date.now() 
              };
              return updatedBank;
            }
            return bank;
          }),
        }));
        return { 
          question: updatedBank ? newQuestion : null, 
          isDuplicate: false 
        };
      },
      updateQuestionInBank: (bankId, questionId, questionData) => {
        let updatedQuestion : Question | null = null;
        set((state) => ({
          questionBanks: state.questionBanks.map(bank => {
            if (bank.id === bankId) {
              return {
                ...bank,
                questions: bank.questions.map(q => {
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
          questionBanks: state.questionBanks.map(bank =>
            bank.id === bankId
              ? { ...bank, questions: bank.questions.filter(q => q.id !== questionId), updatedAt: Date.now() }
              : bank
          ),
          records: state.records.filter(record => record.questionId !== questionId)
        }));
      },
      getQuestionById: (questionId) => {
        for (const bank of get().questionBanks) {
          const question = bank.questions.find(q => q.id === questionId);
          if (question) {
            return { question, bank };
          }
        }
        return undefined;
      },
      addRecord: (record) => {
        const newRecord: QuestionRecord = { ...record, id: uuidv4() };
        set((state) => ({ records: [...state.records, newRecord] }));
      },
      clearRecords: (bankId) => {
        if (bankId) {
            const bank = get().getQuestionBankById(bankId);
            if (!bank) return;
            const questionIdsInBank = bank.questions.map(q => q.id);
            set(state => ({
                records: state.records.filter(r => !questionIdsInBank.includes(r.questionId))
            }));
        } else {
            set({ records: [] });
        }
      },
      removeWrongRecordsByQuestionId: (questionIdToRemove) => {
        set((state) => ({
          records: state.records.filter(record => 
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
        set((state) => ({ // Pass the current state to ensure other parts of the state are not affected
            ...state, 
            settings: initialSettings 
        }));
      },
    }),
    {
      name: 'quiz-storage', 
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        questionBanks: state.questionBanks, 
        records: state.records, 
        settings: state.settings, // Persist the entire settings object
      }),
      merge: (persistedState, currentState) => {
        const merged = { ...currentState, ...(persistedState as Partial<QuizState>) };
        if (!(persistedState as QuizState)?.settings) {
          merged.settings = initialSettings;
        } else {
          merged.settings = { ...initialSettings, ...(persistedState as QuizState).settings };
        }
        return merged;
      },
    }
  )
);
