'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Question, QuestionBank, QuestionRecord, QuestionType, QuestionOption } from '@/types/quiz';
import { v4 as uuidv4 } from 'uuid';
import { SIMILAR_QUESTIONS_PROMPT, callAI } from '@/constants/ai';
import * as quizApi from '@/lib/api/quizApi';

/**
 * 包含用户偏好设置和AI提供商配置
 * 这些配置会被持久化到localStorage
 * AI提供商配置用于生成相似题目等功能
 */
export interface QuizSettings {
  shufflePracticeOptions: boolean;      // 练习模式选项随机排序
  shuffleReviewOptions: boolean;        // 复习模式选项随机排序
  shufflePracticeQuestionOrder: boolean; // 练习模式题目随机排序
  shuffleReviewQuestionOrder: boolean;   // 复习模式题目随机排序
  markMistakeAsCorrectedOnReviewSuccess: boolean; // 复习成功时标记错题为已纠正
  checkDuplicateQuestion: boolean;      // 检查重复题目
  showDetailedExplanations: boolean;    // 显示详细解释
  autoContinue: boolean;                // 自动继续
  theme: 'light' | 'dark' | 'system';   // 主题设置

  // AI提供商设置
  aiProvider: 'deepseek' | 'alibaba';   // AI提供商选择
  deepseekApiKey: string;               // DeepSeek API密钥
  deepseekBaseUrl: string;              // DeepSeek基础URL
  alibabaApiKey: string;                // 阿里巴巴API密钥
  // 阿里巴巴基础URL是固定的："https://dashscope.aliyuncs.com/compatible-mode/v1"
  // 阿里巴巴模型可以在这里存储，例如：qwenModel: string;
}

/**
 * 题库全局状态接口
 * 定义整个应用的状态管理结构和方法
 * 这个接口定义了所有会被存储到localStorage的状态和操作这些状态的方法
 */
export interface QuizState {
  questionBanks: QuestionBank[];        // 题库列表 - 会被持久化到localStorage
  records: QuestionRecord[];            // 答题记录 - 会被持久化到localStorage
  settings: QuizSettings;               // 设置状态 - 会被持久化到localStorage
  isCloudMode: boolean;                 // 是否为云模式 - 会被持久化到localStorage
  isLoadingCloud: boolean;              // 是否正在加载云数据 - 临时状态，不会被持久化
  lastCloudSync: number | null;         // 最后同步云端时间 - 会被持久化到localStorage

  // 相似题目功能相关状态 - 这些是临时状态，不会被持久化到localStorage
  isSimilarQuestionsModalOpen: boolean; // 相似题目模态框是否打开
  generatingSimilarQuestions: boolean;  // 是否正在生成相似题目
  similarQuestionsList: Question[];     // 相似题目列表
  selectedOriginalQuestionsForSimilarity: Question[]; // 用于生成相似题目的原始题目

  /**
   * 添加新题库
   * @param name 题库名称
   * @param description 题库描述（可选）
   * @returns 返回创建的题库对象
   */
  addQuestionBank: (name: string, description?: string) => Promise<QuestionBank>;
  
  /**
   * 根据ID获取题库
   * @param id 题库ID
   * @returns 返回题库对象或undefined
   */
  getQuestionBankById: (id: string) => QuestionBank | undefined;
  
  /**
   * 更新题库信息
   * @param id 题库ID
   * @param name 新题库名称
   * @param description 新题库描述（可选）
   */
  updateQuestionBank: (id: string, name: string, description?: string) => Promise<void>;
  
  /**
   * 删除题库
   * @param id 要删除的题库ID
   */
  deleteQuestionBank: (id: string) => Promise<void>;
  
  /**
   * 向题库添加题目
   * @param bankId 题库ID
   * @param question 题目数据（不含ID）
   * @returns 返回添加的题目和是否为重复题目
   */
  addQuestionToBank: (bankId: string, question: Omit<Question, 'id'>) => Promise<{ question: Question | null; isDuplicate: boolean }>;
  
  /**
   * 更新题库中的题目
   * @param bankId 题库ID
   * @param questionId 题目ID
   * @param questionData 要更新的题目数据
   * @returns 返回更新后的题目或null
   */
  updateQuestionInBank: (bankId: string, questionId: string, questionData: Partial<Omit<Question, 'id'>>) => Promise<Question | null>;
  
  /**
   * 从题库中删除题目
   * @param bankId 题库ID
   * @param questionId 题目ID
   */
  deleteQuestionFromBank: (bankId: string, questionId: string) => Promise<void>;
  
  /**
   * 根据题目ID获取题目及其所在题库
   * @param questionId 题目ID
   * @returns 返回题目和所在题库，或undefined
   */
  getQuestionById: (questionId: string) => { question: Question, bank: QuestionBank } | undefined;
  
  /**
   * 添加答题记录
   * @param record 答题记录数据（不含ID）
   */
  addRecord: (record: Omit<QuestionRecord, 'id'>) => Promise<void>;
  
  /**
   * 清除答题记录
   * @param bankId 题库ID（可选，若不提供则清除所有记录）
   */
  clearRecords: (bankId?: string) => Promise<void>;
  
  /**
   * 移除指定题目的错误记录
   * @param questionIdToRemove 要移除错误记录的题目ID
   */
  removeWrongRecordsByQuestionId: (questionIdToRemove: string) => Promise<void>;
  
  /**
   * 设置单个配置项
   * @param key 配置项键名
   * @param value 配置项值
   */
  setQuizSetting: <K extends keyof QuizSettings>(key: K, value: QuizSettings[K]) => void;
  
  /**
   * 重置所有配置为默认值
   */
  resetQuizSettings: () => void;

  /**
   * 切换相似题目模态框显示状态
   * @param isOpen 是否打开（可选，不提供则切换状态）
   */
  toggleSimilarQuestionsModal: (isOpen?: boolean) => void;
  
  /**
   * 设置用于生成相似题目的原始题目
   * @param questions 原始题目列表
   */
  setSelectedOriginalQuestionsForSimilarity: (questions: Question[]) => void;
  
  /**
   * 生成相似题目
   * 调用AI接口生成与原题相似的新题目
   * 使用src/constants/ai.ts中的callAI函数和SIMILAR_QUESTIONS_PROMPT提示词
   */
  generateSimilarQuestions: (originalQuestions: Question[]) => Promise<void>;
  
  /**
   * 导入生成的相似题目到指定题库
   * @param selectedQuestions 选择导入的题目列表
   * @param targetBankId 目标题库ID
   * @returns 导入结果，包含成功数量和跳过数量
   */
  importGeneratedQuestions: (selectedQuestions: Question[], targetBankId: string) => Promise<{ success: boolean; importedCount: number; skippedCount: number; error?: string }>;
  
  /**
   * 设置云模式状态
   * @param cloud 是否启用云模式
   */
  setCloudMode: (cloud: boolean) => void;
  
  /**
   * 从云端同步数据
   */
  syncFromCloud: () => Promise<void>;
  
  /**
   * 将题库上传到云端
   * @param bankId 要上传的题库ID
   */
  uploadBankToCloud: (bankId: string) => Promise<void>;
}

/**
 * 初始设置配置
 * 定义系统默认配置值
 * 当localStorage中没有存储设置或设置不完整时，会使用这些默认值
 */
const initialSettings: QuizSettings = {
  shufflePracticeOptions: true,
  shuffleReviewOptions: true,
  shufflePracticeQuestionOrder: false,
  shuffleReviewQuestionOrder: false,
  markMistakeAsCorrectedOnReviewSuccess: true,
  checkDuplicateQuestion: true,
  showDetailedExplanations: true,
  autoContinue: false,
  theme: 'system',

  // AI提供商默认配置
  aiProvider: 'deepseek',
  deepseekApiKey: '',
  deepseekBaseUrl: 'https://api.deepseek.com', // 默认API地址
  alibabaApiKey: '',
};

/**
 * 创建全局题库状态管理store
 * 使用zustand持久化中间件保存状态到localStorage
 * 
 * 整个store的核心实现，包含：
 * 1. 状态定义和初始化
 * 2. 各种操作方法的实现
 * 3. 持久化配置，指定如何将状态存储到localStorage
 */
export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      // 初始化状态
      questionBanks: [],
      records: [],
      settings: initialSettings,
      isCloudMode: false,
      isLoadingCloud: false,
      lastCloudSync: null,

      // 相似题目功能状态初始化
      isSimilarQuestionsModalOpen: false,
      generatingSimilarQuestions: false,
      similarQuestionsList: [],
      selectedOriginalQuestionsForSimilarity: [],

      /**
       * 添加新题库
       * 云模式下调用API，本地模式直接添加到state并通过persist中间件自动保存到localStorage
       */
      addQuestionBank: async (name, description) => {
        if (get().isCloudMode) {
          const bank = await quizApi.createQuestionBank({ name, description });
          await get().syncFromCloud();
          return bank;
        } else {
          // 本地模式：创建新题库对象，生成唯一ID
          const newBank: QuestionBank = { id: uuidv4(), name, description, questions: [], createdAt: Date.now(), updatedAt: Date.now() };
          // 更新状态，这会触发persist中间件将更新后的状态保存到localStorage
          set((state) => ({ questionBanks: [...state.questionBanks, newBank] }));
          return newBank;
        }
      },
      
      /**
       * 根据ID获取题库
       * 直接从状态中查找，不涉及localStorage的读写
       */
      getQuestionBankById: (id) => get().questionBanks.find(bank => bank.id === id),
      
      /**
       * 更新题库信息
       * 云模式下调用API，本地模式直接更新state并通过persist中间件自动保存到localStorage
       */
      updateQuestionBank: async (id, name, description) => {
        if (get().isCloudMode) {
          await quizApi.updateQuestionBank({
            id,
            name,
            description
          });
          await get().syncFromCloud();
        } else {
          // 本地模式：更新题库信息
          set((state) => ({
            questionBanks: state.questionBanks.map(bank =>
              bank.id === id
                ? { ...bank, name, description: description || bank.description, updatedAt: Date.now() }
                : bank
            )
          }));
          // 更新状态后，persist中间件会自动将新状态保存到localStorage，实现题库信息更新的持久化
        }
      },
      
      /**
       * 删除题库
       * 同时删除相关的答题记录
       * 云模式下调用API，本地模式直接从状态中删除并自动更新localStorage
       */
      deleteQuestionBank: async (id) => {
        if (get().isCloudMode) {
          await quizApi.deleteQuestionBank(id);
          await get().syncFromCloud();
        } else {
          // 本地模式：从状态中删除指定题库和相关记录
          // 获取要删除题库中的所有题目ID
          const bankToDelete = get().questionBanks.find(bank => bank.id === id);
          const questionIds = bankToDelete?.questions.map(q => q.id) || [];
          
          // 更新状态，移除题库和相关记录
          set((state) => ({
            questionBanks: state.questionBanks.filter(bank => bank.id !== id),
            records: state.records.filter(record => !questionIds.includes(record.questionId))
          }));
          // 更新状态后，persist中间件会自动将新状态保存到localStorage，实现题库删除的持久化
        }
      },
      
      /**
       * 向题库添加题目
       * 可选检查重复题目
       * 云模式下调用API，本地模式直接添加到state并通过persist中间件自动保存到localStorage
       */
      addQuestionToBank: async (bankId, question) => {
        if (get().isCloudMode) {
          try {
            const result = await quizApi.createQuestion(bankId, question);
            await get().syncFromCloud();
            return { question: result, isDuplicate: false };
          } catch (error) {
            if (error && typeof error === 'object' && 'isDuplicate' in error) {
              return { question: null, isDuplicate: true };
            }
            console.error('添加题目失败:', error);
            return { question: null, isDuplicate: false };
          }
        } else {
          // 本地模式：检查题库是否存在
          const bank = get().getQuestionBankById(bankId);
          if (!bank) {
            return { question: null, isDuplicate: false };
          }
          
          // 如果设置了检查重复，检查是否存在完全相同的题目（通过题干比较）
          if (get().settings.checkDuplicateQuestion && 
              bank.questions.some(q => q.content === question.content)) {
            return { question: null, isDuplicate: true };
          }
          
          // 创建新题目，生成唯一ID
          const newQuestion: Question = {
            ...question,
            id: uuidv4(),
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          
          // 更新状态，将题目添加到题库中
          set((state) => ({
            questionBanks: state.questionBanks.map(bank =>
              bank.id === bankId
                ? { ...bank, questions: [...bank.questions, newQuestion], updatedAt: Date.now() }
                : bank
            )
          }));
          // 更新状态后，persist中间件会自动将新状态保存到localStorage，实现题目添加的持久化
          
          return { question: newQuestion, isDuplicate: false };
        }
      },
      
      /**
       * 更新题库中的题目
       * 云模式下调用API，本地模式直接更新state并通过persist中间件自动保存到localStorage
       */
      updateQuestionInBank: async (bankId, questionId, questionData) => {
        if (get().isCloudMode) {
          const result = await quizApi.updateQuestion(bankId, questionId, questionData);
          await get().syncFromCloud();
          return result;
        } else {
          // 本地模式：检查题库是否存在
          const bank = get().getQuestionBankById(bankId);
          if (!bank) {
            return null;
          }
          
          // 检查题目是否存在
          const questionIndex = bank.questions.findIndex(q => q.id === questionId);
          if (questionIndex === -1) {
            return null;
          }
          
          // 更新题目
          const updatedQuestion = {
            ...bank.questions[questionIndex],
            ...questionData,
            updatedAt: Date.now()
          };
          
          // 更新状态
          set((state) => ({
            questionBanks: state.questionBanks.map(bank =>
              bank.id === bankId
                ? {
                    ...bank,
                    questions: bank.questions.map(q =>
                      q.id === questionId ? updatedQuestion : q
                    ),
                    updatedAt: Date.now()
                  }
                : bank
            )
          }));
          // 更新状态后，persist中间件会自动将新状态保存到localStorage，实现题目更新的持久化
          
          return updatedQuestion;
        }
      },
      
      /**
       * 从题库中删除题目
       * 同时删除相关的答题记录
       * 云模式下调用API，本地模式直接从状态中删除并自动更新localStorage
       */
      deleteQuestionFromBank: async (bankId, questionId) => {
        if (get().isCloudMode) {
          await quizApi.deleteQuestion(bankId, questionId);
          await get().syncFromCloud();
        } else {
          // 本地模式：从状态中删除指定题目和相关记录
          set((state) => ({
            questionBanks: state.questionBanks.map(bank =>
              bank.id === bankId
                ? { ...bank, questions: bank.questions.filter(q => q.id !== questionId), updatedAt: Date.now() }
                : bank
            ),
            records: state.records.filter(record => record.questionId !== questionId)
          }));
          // 更新状态后，persist中间件会自动将新状态保存到localStorage，实现题目删除的持久化
        }
      },
      
      /**
       * 根据题目ID获取题目及其所在题库
       * 直接从状态中查找，不涉及localStorage的读写
       */
      getQuestionById: (questionId) => {
        for (const bank of get().questionBanks) {
          const question = bank.questions.find(q => q.id === questionId);
          if (question) {
            return { question, bank };
          }
        }
        return undefined;
      },
      
      /**
       * 添加答题记录
       * 云模式下调用API，本地模式直接添加到状态并自动保存到localStorage
       */
      addRecord: async (record) => {
        if (get().isCloudMode) {
          await quizApi.createQuestionRecord(record);
          await get().syncFromCloud();
        } else {
          // 本地模式：创建新记录，生成唯一ID
          const newRecord: QuestionRecord = { ...record, id: uuidv4() };
          // 更新状态，添加新记录
          set((state) => ({ records: [...state.records, newRecord] }));
          // 更新状态后，persist中间件会自动将新状态保存到localStorage，实现答题记录的持久化
        }
      },
      
      /**
       * 清除答题记录
       * 可选择清除特定题库的记录或所有记录
       * 云模式下调用API，本地模式直接从状态中清除并自动更新localStorage
       */
      clearRecords: async (bankId) => {
        if (get().isCloudMode) {
          await quizApi.clearQuestionRecords(bankId);
          await get().syncFromCloud();
        } else {
          // 本地模式：根据是否指定题库ID来清除记录
          if (bankId) {
            const bank = get().getQuestionBankById(bankId);
            if (!bank) return;
            const questionIdsInBank = bank.questions.map(q => q.id);
            set(state => ({
              records: state.records.filter(r => !questionIdsInBank.includes(r.questionId))
            }));
          } else {
            // 清除所有记录
            set({ records: [] });
          }
          // 更新状态后，persist中间件会自动将新状态保存到localStorage，实现记录清除的持久化
        }
      },
      
      /**
       * 移除指定题目的错误记录
       * 用于标记错题为已纠正
       * 云模式下调用API，本地模式直接从状态中移除并自动更新localStorage
       */
      removeWrongRecordsByQuestionId: async (questionIdToRemove) => {
        if (get().isCloudMode) {
          await quizApi.deleteWrongRecordsByQuestionId(questionIdToRemove);
          await get().syncFromCloud();
        } else {
          // 本地模式：移除指定题目的错误记录
          set((state) => ({
            records: state.records.filter(record =>
              !(record.questionId === questionIdToRemove && !record.isCorrect)
            ),
          }));
          // 更新状态后，persist中间件会自动将新状态保存到localStorage，实现记录移除的持久化
        }
      },
      
      /**
       * 设置单个配置项
       * 直接更新状态中的设置，并通过persist中间件自动保存到localStorage
       */
      setQuizSetting: (key, value) => {
        set((state) => ({
          settings: {
            ...state.settings,
            [key]: value,
          },
        }));
        // 更新状态后，persist中间件会自动将新状态保存到localStorage，实现设置的持久化
      },
      
      /**
       * 重置所有配置为默认值
       * 直接用初始设置替换当前设置，并通过persist中间件自动保存到localStorage
       */
      resetQuizSettings: () => {
        set((state) => ({ ...state, settings: initialSettings }));
        // 更新状态后，persist中间件会自动将新状态保存到localStorage，实现设置重置的持久化
      },

      /**
       * 切换相似题目模态框显示状态
       */
      toggleSimilarQuestionsModal: (isOpen) => {
        set((state) => ({ isSimilarQuestionsModalOpen: isOpen === undefined ? !state.isSimilarQuestionsModalOpen : isOpen }));
      },
      
      /**
       * 设置用于生成相似题目的原始题目
       */
      setSelectedOriginalQuestionsForSimilarity: (questions) => {
        set({ selectedOriginalQuestionsForSimilarity: questions });
      },
      
      /**
       * 生成相似题目
       * 调用AI接口，将原题转换为相似题目
       */
      generateSimilarQuestions: async (originalQuestions) => {
        set({ generatingSimilarQuestions: true, similarQuestionsList: [] });
        
        try {
          // 准备原题数据
          const originalQuestionsData = originalQuestions.map(q => ({
            content: q.content,
            type: q.type,
            options: q.options || [],
            answer: q.answer,
            explanation: q.explanation
          }));
          
          // 构造AI提示
          const prompt = SIMILAR_QUESTIONS_PROMPT.replace(
            '{{originalQuestions}}', 
            JSON.stringify(originalQuestionsData, null, 2)
          );
          
          const { aiProvider, deepseekApiKey, deepseekBaseUrl, alibabaApiKey } = get().settings;
          
          // 修正callAI调用，使用正确的参数格式
          const apiKey = aiProvider === 'deepseek' ? deepseekApiKey : alibabaApiKey;
          const response = await callAI(
            aiProvider,
            [
              { role: "system", content: "你是一个专业的出题专家" },
              { role: "user", content: prompt }
            ],
            apiKey,
            aiProvider === 'deepseek' ? deepseekBaseUrl : undefined
          );
          
          // 解析AI响应
          let generatedQuestions: Question[] = [];
          try {
            // 尝试解析JSON格式的题目数据
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                              response.match(/```([\s\S]*?)```/);
            
            if (jsonMatch && jsonMatch[1]) {
              const parsedData = JSON.parse(jsonMatch[1]);
              
              if (Array.isArray(parsedData)) {
                generatedQuestions = parsedData.map(q => ({
                  ...q,
                  id: uuidv4(),
                  createdAt: Date.now(),
                  updatedAt: Date.now()
                }));
              }
            }
          } catch (e) {
            console.error('解析AI生成的题目时出错:', e);
          }
          
          // 更新状态
          set({ 
            generatingSimilarQuestions: false,
            similarQuestionsList: generatedQuestions
          });
        } catch (error) {
          console.error('生成相似题目时出错:', error);
          set({ generatingSimilarQuestions: false });
        }
      },
      
      /**
       * 导入生成的相似题目到指定题库
       * 处理重复题目的逻辑
       */
      importGeneratedQuestions: async (selectedQuestions, targetBankId) => {
        const { addQuestionToBank, getQuestionBankById } = get();
        let importedCount = 0;
        let skippedCount = 0;

        if (!getQuestionBankById(targetBankId)) {
            return { success: false, importedCount, skippedCount, error: "目标题库不存在" };
        }

        for (const question of selectedQuestions) {
          const { id, ...questionData } = question; // 添加题目不需要ID
          const result = await addQuestionToBank(targetBankId, questionData);
          if (result.question) {
            importedCount++;
          } else if (result.isDuplicate) {
            skippedCount++;
            console.warn(`题目(内容开头: "${question.content.substring(0,30)}...")是重复的，已跳过。`);
          } else {
            console.error(`导入题目失败(内容开头: "${question.content.substring(0,30)}...")，原因未知。`);
          }
        }
        return { success: true, importedCount, skippedCount };
      },

      /**
       * 设置云模式状态
       */
      setCloudMode: (cloud) => set({ isCloudMode: cloud }),
      
      /**
       * 从云端同步数据
       * 获取题库和答题记录
       */
      syncFromCloud: async () => {
        set({ isLoadingCloud: true });
        const banks = await quizApi.getUserQuestionBanks();
        const records = await quizApi.getUserQuestionRecords();
        set({ questionBanks: banks, records, isLoadingCloud: false, lastCloudSync: Date.now() });
      },
      
      /**
       * 将题库上传到云端
       * 创建新题库并逐个添加题目
       */
      uploadBankToCloud: async (bankId) => {
        const bank = get().getQuestionBankById(bankId);
        if (!bank) throw new Error('题库不存在');
        const created = await quizApi.createQuestionBank({ name: bank.name, description: bank.description });
        for (const q of bank.questions) {
          const { id, createdAt, updatedAt, ...data } = q;
          await quizApi.createQuestion(created.id, data);
        }
        await get().syncFromCloud();
      },
    }),
    {
      // persist中间件配置，用于将状态持久化到localStorage
      name: 'quiz-storage',  // localStorage中存储的键名
      storage: createJSONStorage(() => localStorage),  // 指定使用localStorage作为存储介质
      
      // 指定哪些状态需要被持久化存储
      partialize: (state) => ({ 
        questionBanks: state.questionBanks,  // 题库列表
        records: state.records,              // 答题记录
        settings: state.settings,            // 设置
        isCloudMode: state.isCloudMode,      // 云模式状态
        lastCloudSync: state.lastCloudSync,  // 最后同步时间
      }),
      
      // 定义如何合并持久化的状态和当前状态
      // 这在应用启动时从localStorage加载数据时非常重要
      merge: (persistedState, currentState) => {
        const merged = { ...currentState, ...(persistedState as Partial<QuizState>) };
        // 确保设置完整，如果localStorage中没有设置或设置不完整，则使用默认设置
        if (!(persistedState as QuizState)?.settings) {
          merged.settings = initialSettings;
        } else {
          // 合并默认设置和持久化的设置，确保新增的设置项也有默认值
          merged.settings = { ...initialSettings, ...(persistedState as QuizState).settings };
        }
        return merged;
      },
    }
  )
); 