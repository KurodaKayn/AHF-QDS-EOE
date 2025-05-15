import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Question, QuestionBank, QuestionRecord, QuestionType, QuestionOption } from '@/types/quiz';
import { v4 as uuidv4 } from 'uuid';
import { SIMILAR_QUESTIONS_PROMPT, callAI } from '@/constants/ai';

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

  // >>> 新增操作，用于相似题目功能
  toggleSimilarQuestionsModal: (isOpen?: boolean) => void;
  setSelectedOriginalQuestionsForSimilarity: (questions: Question[]) => void;
  generateSimilarQuestions: (originalQuestions: Question[]) => Promise<void>; 
  importGeneratedQuestions: (selectedQuestions: Question[], targetBankId: string) => Promise<{ success: boolean; importedCount: number; skippedCount: number; error?: string }>;
  // <<< 新增操作结束
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

      // >>> 初始化新增状态
      isSimilarQuestionsModalOpen: false,
      generatingSimilarQuestions: false,
      similarQuestionsList: [],
      selectedOriginalQuestionsForSimilarity: [],
      // <<< 初始化新增状态结束

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

      // >>> 实现新增操作
      toggleSimilarQuestionsModal: (isOpen) => {
        set((state) => ({ isSimilarQuestionsModalOpen: isOpen === undefined ? !state.isSimilarQuestionsModalOpen : isOpen }));
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
          // 获取AI提供商相关配置
          const { aiProvider, deepseekApiKey, deepseekBaseUrl, alibabaApiKey } = get().settings;
          const apiKey = aiProvider === 'deepseek' ? deepseekApiKey : alibabaApiKey;
          const baseUrl = aiProvider === 'deepseek' ? deepseekBaseUrl : undefined;
          
          if (!apiKey) {
            throw new Error(`未配置${aiProvider === 'deepseek' ? 'DeepSeek' : '阿里云'}的API密钥`);
          }

          // 准备输入数据：将原题转换为适当格式
          const originalQuestionsData = originalQuestions.map(q => {
            return {
              content: q.content,
              type: q.type,
              options: q.options,
              answer: q.answer,
              tags: q.tags || []
            };
          });

          // 构建消息
          const messages = [
            { role: 'system', content: SIMILAR_QUESTIONS_PROMPT },
            { role: 'user', content: `请基于以下题目生成相似题目：\n${JSON.stringify(originalQuestionsData, null, 2)}` }
          ];

          console.log('Calling AI to generate similar questions based on:', originalQuestionsData);
          
          // 调用AI接口
          const response = await callAI(aiProvider, messages, apiKey, baseUrl);
          console.log('AI Response:', response);
          
          // 解析API返回的JSON
          let generatedQuestionsData;
          try {
            // 尝试直接解析返回的内容为JSON
            generatedQuestionsData = JSON.parse(response);
          } catch (e) {
            console.error('解析AI返回的JSON失败，尝试提取JSON部分', e);
            
            // 如果直接解析失败，尝试从返回的文本中提取JSON部分
            const jsonMatch = response.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (jsonMatch) {
              try {
                generatedQuestionsData = JSON.parse(jsonMatch[0]);
              } catch (e2) {
                console.error('从返回文本中提取JSON失败', e2);
                throw new Error('无法解析AI返回的数据');
              }
            } else {
              throw new Error('AI返回的数据不包含有效的JSON');
            }
          }

          if (!Array.isArray(generatedQuestionsData)) {
            throw new Error('AI返回的数据格式不正确，应为题目数组');
          }

          // 处理返回的题目数据，补充必要的字段
          const processedQuestions: Question[] = generatedQuestionsData.map(q => {
            // 确保选项有ID
            let processedOptions: QuestionOption[] = [];
            if (q.options && Array.isArray(q.options)) {
              processedOptions = q.options.map((opt: any, idx: number) => {
                // 如果选项没有ID，生成一个
                if (!opt.id) {
                  return { ...opt, id: uuidv4() };
                }
                return opt;
              });
            }

            // 填充完整的题目对象
            return {
              id: uuidv4(),
              content: q.content,
              type: q.type,
              options: processedOptions,
              answer: q.answer,
              explanation: q.explanation || '',
              tags: q.tags || [],
              createdAt: Date.now(),
              updatedAt: Date.now()
            };
          });

          console.log('Processed generated questions:', processedQuestions);
          
          // 更新状态
          set({
            similarQuestionsList: processedQuestions,
            generatingSimilarQuestions: false,
          });
        } catch (error) {
          console.error('生成相似题目失败:', error);
          // 出错时显示一个提示，并重置状态
          alert(`生成相似题目失败: ${error instanceof Error ? error.message : '未知错误'}`);
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
            return { success: false, importedCount, skippedCount, error: "目标题库不存在" };
        }

        for (const question of selectedQuestions) {
          const { id, ...questionData } = question; // id is not needed for addQuestionToBank
          const result = addQuestionToBank(targetBankId, questionData);
          if (result.question) {
            importedCount++;
          } else if (result.isDuplicate) {
            skippedCount++;
            console.warn(`Question (content starting with "${question.content.substring(0,30)}...") was a duplicate and skipped.`);
          } else {
            console.error(`Failed to import question (content starting with "${question.content.substring(0,30)}...") for unknown reasons.`);
          }
        }
        return { success: true, importedCount, skippedCount };
      },
      // <<< 实现新增操作结束
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
