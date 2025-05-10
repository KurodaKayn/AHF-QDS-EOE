import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Question, QuestionBank, QuestionRecord, ApiKeyConfig } from '@/types/quiz';

interface QuizState {
  questionBanks: QuestionBank[];
  currentBankId: string | null;
  records: QuestionRecord[];
  apiKeys: ApiKeyConfig;
  
  // 题库操作
  addQuestionBank: (bank: QuestionBank) => void;
  updateQuestionBank: (id: string, bank: Partial<QuestionBank>) => void;
  removeQuestionBank: (id: string) => void;
  setCurrentBank: (id: string | null) => void;
  addQuestionsToBank: (bankId: string, questions: Question[]) => void;
  
  // 题目操作
  addQuestion: (bankId: string, question: Question) => void;
  updateQuestion: (bankId: string, questionId: string, question: Partial<Question>) => void;
  removeQuestion: (bankId: string, questionId: string) => void;
  
  // 记录操作
  addRecord: (record: QuestionRecord) => void;
  clearRecords: () => void;
  
  // API密钥操作
  setApiKey: (key: Partial<ApiKeyConfig>) => void;
}

/**
 * 题库状态管理
 */
export const useQuizStore = create<QuizState>()(
  persist(
    (set) => ({
      questionBanks: [],
      currentBankId: null,
      records: [],
      apiKeys: {
        deepseek: '',
      },
      
      // 题库操作
      addQuestionBank: (bank) => 
        set((state) => ({
          questionBanks: [...state.questionBanks, bank]
        })),
      
      updateQuestionBank: (id, updatedBank) => 
        set((state) => ({
          questionBanks: state.questionBanks.map(bank => 
            bank.id === id ? { ...bank, ...updatedBank, updatedAt: Date.now() } : bank
          )
        })),
      
      removeQuestionBank: (id) => 
        set((state) => ({
          questionBanks: state.questionBanks.filter(bank => bank.id !== id),
          currentBankId: state.currentBankId === id ? null : state.currentBankId
        })),
      
      setCurrentBank: (id) => 
        set({ currentBankId: id }),
      
      addQuestionsToBank: (bankId, questions) =>
        set((state) => ({
          questionBanks: state.questionBanks.map(bank =>
            bank.id === bankId
              ? {
                  ...bank,
                  questions: [...bank.questions, ...questions],
                  updatedAt: Date.now(),
                }
              : bank
          ),
        })),
      
      // 题目操作
      addQuestion: (bankId, question) => 
        set((state) => ({
          questionBanks: state.questionBanks.map(bank => 
            bank.id === bankId 
              ? { 
                  ...bank, 
                  questions: [...bank.questions, question],
                  updatedAt: Date.now()
                } 
              : bank
          )
        })),
      
      updateQuestion: (bankId, questionId, updatedQuestion) => 
        set((state) => ({
          questionBanks: state.questionBanks.map(bank => 
            bank.id === bankId 
              ? { 
                  ...bank, 
                  questions: bank.questions.map(q => 
                    q.id === questionId 
                      ? { ...q, ...updatedQuestion, updatedAt: Date.now() } 
                      : q
                  ),
                  updatedAt: Date.now()
                } 
              : bank
          )
        })),
      
      removeQuestion: (bankId, questionId) => 
        set((state) => ({
          questionBanks: state.questionBanks.map(bank => 
            bank.id === bankId 
              ? { 
                  ...bank, 
                  questions: bank.questions.filter(q => q.id !== questionId),
                  updatedAt: Date.now()
                } 
              : bank
          )
        })),
      
      // 记录操作
      addRecord: (record) => 
        set((state) => ({
          records: [...state.records, record]
        })),
      
      clearRecords: () => 
        set({ records: [] }),
      
      // API密钥操作
      setApiKey: (key) => 
        set((state) => ({
          apiKeys: { ...state.apiKeys, ...key }
        })),
    }),
    {
      name: 'quiz-storage',
    }
  )
); 