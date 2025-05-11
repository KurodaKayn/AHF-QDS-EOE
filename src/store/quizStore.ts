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

  // New AI Provider Settings
  aiProvider: 'deepseek' | 'alibaba';
  deepseekApiKey: string;
  deepseekBaseUrl: string; // e.g., https://api.deepseek.com
  alibabaApiKey: string;
  // Alibaba base URL is fixed: "https://dashscope.aliyuncs.com/compatible-mode/v1"
  // Alibaba model can be stored here if needed, e.g., qwenModel: string;
}

export interface QuizState {
  questionBanks: QuestionBank[];
  records: QuestionRecord[];
  settings: QuizSettings; // Settings state including AI provider config

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
  
  // Generic setting action
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

  // AI Provider Defaults
  aiProvider: 'deepseek',
  deepseekApiKey: '',
  deepseekBaseUrl: 'https://api.deepseek.com', // Default to common public API
  alibabaApiKey: '',
};

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      questionBanks: [],
      records: [],
      settings: initialSettings, // Initialize settings

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
        
        // 检查是否存在相同题干的题目
        const duplicateQuestion = bank.questions.find(
          q => q.content.trim() === questionData.content.trim()
        );
        
        // 如果存在重复的题目，直接返回
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
