"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FaExclamationTriangle,
  FaTrash,
  FaTimes,
  FaSearch,
  FaPlayCircle,
  FaListUl,
  FaCheck,
  FaMagic,
  FaRobot,
  FaSyncAlt,
} from "react-icons/fa";
import { useQuizStore } from "@/store/quizStore";
import {
  Question,
  QuestionType,
  QuestionBank,
  QuestionOption,
} from "@/types/quiz";
import { QUESTION_TYPE_NAMES, getTagColor } from "@/constants/quiz";
import WrongQuestionItem, {
  WrongQuestionDisplay,
} from "@/components/quiz/WrongQuestionItem";
import SimilarQuestionsModal from "@/components/quiz/SimilarQuestionsModal";
import { EXPLANATION_PROMPT, callAI, callAIStream } from "@/constants/ai";

/**
 * 错题本页面
 */
export default function ReviewPage() {
  const router = useRouter();
  const {
    questionBanks,
    records,
    clearRecords,
    updateQuestionInBank,
    settings,
    isSimilarQuestionsModalOpen,
    generatingSimilarQuestions,
    similarQuestionsList,
    selectedOriginalQuestionsForSimilarity,
    toggleSimilarQuestionsModal,
    setSelectedOriginalQuestionsForSimilarity,
    generateSimilarQuestions,
    importGeneratedQuestions,
  } = useQuizStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBankId, setFilterBankId] = useState<string | "all">("all");
  const [viewMode, setViewMode] = useState<"options" | "list">("options");
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(
    new Set()
  );
  const [generatingExplanations, setGeneratingExplanations] = useState<
    Set<string>
  >(new Set());
  const [aiError, setAiError] = useState<string | null>(null);
  const [currentExplanations, setCurrentExplanations] = useState<
    Record<string, string>
  >({});
  const [completedExplanations, setCompletedExplanations] = useState<
    Record<string, string>
  >({});

  /**
   * 处理开始练习错题
   */
  const handleStartPractice = () => {
    const wrongRecs = records.filter((record) => !record.isCorrect);
    if (wrongRecs.length === 0) {
      alert("没有错题可供练习！");
      return;
    }
    const bankWithWrong = questionBanks.find((bank) =>
      bank.questions.some((q) => wrongRecs.some((r) => r.questionId === q.id))
    );
    if (bankWithWrong) {
      router.push(`/quiz/practice?bankId=${bankWithWrong.id}&mode=review`);
    } else {
      alert("找不到包含错题的题库！");
    }
  };

  /**
   * 汇总错题信息
   */
  const wrongQuestions = useMemo(() => {
    const wrongRecords = records.filter((record) => !record.isCorrect);
    const questions = wrongRecords
      .map((record) => {
        for (const bank of questionBanks) {
          const question = bank.questions.find(
            (q) => q.id === record.questionId
          );
          if (question) {
            const wrongQuestionDisplayItem: WrongQuestionDisplay = {
              ...question,
              bankId: bank.id,
              bankName: bank.name,
              userAnswer: record.userAnswer,
              answeredAt: record.answeredAt,
            };
            return wrongQuestionDisplayItem;
          }
        }
        return null;
      })
      .filter((q): q is WrongQuestionDisplay => q !== null);
    return questions.sort((a, b) => b.answeredAt - a.answeredAt);
  }, [questionBanks, records]);

  /**
   * 搜索与过滤
   */
  const filteredQuestions = useMemo(() => {
    return wrongQuestions.filter((q) => {
      if (filterBankId !== "all" && q?.bankId !== filterBankId) return false;
      if (searchTerm && q) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return (
          q.content.toLowerCase().includes(lowerSearchTerm) ||
          (q.options?.some((opt) =>
            opt.content.toLowerCase().includes(lowerSearchTerm)
          ) ??
            false) ||
          (q.explanation?.toLowerCase().includes(lowerSearchTerm) ?? false) ||
          (currentExplanations[q.id]?.toLowerCase().includes(lowerSearchTerm) ??
            false) ||
          (completedExplanations[q.id]
            ?.toLowerCase()
            .includes(lowerSearchTerm) ??
            false)
        );
      }
      return true;
    });
  }, [
    wrongQuestions,
    filterBankId,
    searchTerm,
    currentExplanations,
    completedExplanations,
  ]);

  /**
   * 清空错题本
   */
  const handleClearRecords = () => {
    if (confirm("确定要清空错题本吗？此操作不可恢复。")) {
      clearRecords();
      setSelectedQuestions(new Set());
    }
  };

  /**
   * 练习选中题目
   */
  const handlePracticeQuestion = (bankId: string) => {
    router.push(`/quiz/practice?bankId=${bankId}`);
  };

  /**
   * 格式化时间
   */
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("zh-CN");
  };

  /**
   * 处理选择/取消选择题目
   */
  const handleSelectQuestion = (question: WrongQuestionDisplay) => {
    setSelectedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(question.id)) {
        newSet.delete(question.id);
      } else {
        newSet.add(question.id);
      }
      return newSet;
    });
  };

  /**
   * 全选/取消全选
   */
  const handleSelectAll = () => {
    if (
      selectedQuestions.size === filteredQuestions.length &&
      filteredQuestions.length > 0
    ) {
      setSelectedQuestions(new Set());
    } else {
      const newSelected = new Set<string>();
      filteredQuestions.forEach((q) => {
        if (q) newSelected.add(q.id);
      });
      setSelectedQuestions(newSelected);
    }
  };

  /**
   * 使用 AI 生成解析
   */
  const processQuestionForExplanation = async (questionId: string) => {
    if (
      generatingExplanations.has(questionId) ||
      completedExplanations[questionId]
    )
      return;
    const questionInfo = wrongQuestions.find((q) => q.id === questionId);
    if (!questionInfo) return;

    setGeneratingExplanations((prev) => new Set(prev).add(questionId));
    setCurrentExplanations((prev) => ({ ...prev, [questionId]: "" }));

    try {
      let problemInfo = `### 题目信息\n- **题目类型**: ${
        QUESTION_TYPE_NAMES[questionInfo.type]
      }\n`;
      if (questionInfo.options && questionInfo.options.length > 0) {
        problemInfo += "- **选项**:\n";
        questionInfo.options.forEach((opt, idx) => {
          problemInfo += `  - ${String.fromCharCode(65 + idx)}. ${
            opt.content
          }\n`;
        });
      }
      const correctAnswerText = Array.isArray(questionInfo.answer)
        ? questionInfo.answer
            .map(
              (ansId) =>
                questionInfo.options?.find((opt) => opt.id === ansId)
                  ?.content || ansId
            )
            .join(", ")
        : questionInfo.type === QuestionType.TrueFalse
        ? questionInfo.answer === "true"
          ? "正确"
          : "错误"
        : questionInfo.answer;
      problemInfo += `- **正确答案**: ${correctAnswerText}\n`;
      const userAnswerText = Array.isArray(questionInfo.userAnswer)
        ? questionInfo.userAnswer
            .map(
              (ansId) =>
                questionInfo.options?.find((opt) => opt.id === ansId)
                  ?.content || ansId
            )
            .join(", ")
        : questionInfo.type === QuestionType.TrueFalse
        ? questionInfo.userAnswer === "true"
          ? "正确"
          : "错误"
        : questionInfo.userAnswer;
      problemInfo += `- **用户答案**: ${userAnswerText}\n`;

      const messages = [
        { role: "system", content: EXPLANATION_PROMPT },
        { role: "user", content: `${problemInfo}\n${questionInfo.content}` },
      ];
      const { aiConfigs, activeAiConfigId } = settings;
      const activeConfig = aiConfigs.find((c) => c.id === activeAiConfigId);

      if (!activeConfig || !activeConfig.apiKey) {
        throw new Error("未配置有效的 AI 密钥");
      }

      let fullExplanation = "";
      await callAIStream(
        activeConfig.baseUrl,
        activeConfig.apiKey,
        activeConfig.model,
        messages,
        (chunk) => {
          setCurrentExplanations((prev) => {
            fullExplanation = (prev[questionId] || "") + chunk;
            return { ...prev, [questionId]: fullExplanation };
          });
        }
      );
      const finalExplanation = fullExplanation.trim();
      setCompletedExplanations((prev) => ({
        ...prev,
        [questionId]: finalExplanation,
      }));
      if (questionInfo.bankId) {
        updateQuestionInBank(questionInfo.bankId, questionId, {
          explanation: finalExplanation,
        });
      }
    } catch (error) {
      console.error("AI解析生成失败:", error);
      setAiError(
        `题目 "${questionInfo.content.substring(0, 20)}..." 解析生成失败。`
      );
      setCurrentExplanations((prev) => ({
        ...prev,
        [questionId]: "AI解析生成失败，请稍后再试。",
      }));
    } finally {
      setGeneratingExplanations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
    }
  };

  const generateExplanationsForSelected = async () => {
    if (selectedQuestions.size === 0) {
      alert("请先选择需要生成解析的题目！");
      return;
    }
    const { aiConfigs, activeAiConfigId } = settings;
    const activeConfig = aiConfigs.find((c) => c.id === activeAiConfigId);

    if (!activeConfig) {
      setAiError("请先在应用设置中选择一个 AI 模型");
      return;
    }

    if (!activeConfig.apiKey) {
      setAiError(`请先在应用设置中配置 ${activeConfig.name} 的 API 密钥`);
      return;
    }
    setAiError(null);
    selectedQuestions.forEach((questionId) =>
      processQuestionForExplanation(questionId)
    );
  };

  // 当filteredQuestions变化时，清除已完成的解析缓存中不再存在的题目
  useEffect(() => {
    setCompletedExplanations((prevCompletedExplanations) => {
      let changed = false;
      const newCompletedExplanations = { ...prevCompletedExplanations };

      Object.keys(newCompletedExplanations).forEach((questionId) => {
        const stillExists = filteredQuestions.some(
          (q) => q && q.id === questionId
        );
        if (!stillExists) {
          delete newCompletedExplanations[questionId];
          changed = true; // 标记内容已改变
        }
      });

      // 只有当对象内容实际发生变化时才返回新对象，否则返回原对象以避免不必要的重渲染
      if (changed) {
        return newCompletedExplanations;
      }
      return prevCompletedExplanations; // 返回旧的引用，中断循环
    });
  }, [filteredQuestions]); // 依赖项保持不变

  /**
   * 新增：AI 生成相似题目
   */
  const handleGenerateSimilarQuestions = async () => {
    if (selectedQuestions.size === 0) {
      alert("请先选择需要生成相似题目的原始错题！");
      return;
    }
    const selectedItems: WrongQuestionDisplay[] = wrongQuestions.filter((q) =>
      selectedQuestions.has(q.id)
    );
    if (selectedItems.length === 0) {
      alert("未找到选中的题目详情。");
      return;
    }
    // Map WrongQuestionDisplay[] to Question[] before passing to store actions
    const questionsForAI: Question[] = selectedItems.map((q) => ({
      id: q.id,
      type: q.type,
      content: q.content,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation,
      tags: q.tags,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
      // Exclude bankId, bankName, userAnswer, answeredAt for pure Question type
    }));

    setSelectedOriginalQuestionsForSimilarity(questionsForAI);
    await generateSimilarQuestions(questionsForAI);
  };

  if (wrongQuestions.length === 0 && viewMode === "options") {
    return (
      <div className="dark:bg-gray-900 min-h-screen p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            <FaExclamationTriangle className="inline-block mr-2 text-yellow-600 dark:text-yellow-500" />
            错题本
          </h1>
        </div>
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            太棒了，您目前没有错题记录！
          </p>
          <button
            onClick={() => router.push("/quiz")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-md"
          >
            返回题库列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          错题回顾
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          温故而知新，巩固你的薄弱环节。
        </p>
      </header>

      {aiError && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md flex justify-between items-center">
          <span>
            <FaExclamationTriangle className="inline mr-2" />
            {aiError}
          </span>
          <button
            onClick={() => setAiError(null)}
            className="text-red-500 hover:text-red-700 dark:text-red-300 dark:hover:text-red-100"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* 操作栏 */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleStartPractice}
            disabled={wrongQuestions.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm disabled:bg-gray-400 dark:disabled:bg-gray-500 flex items-center gap-2 transition-colors"
          >
            <FaPlayCircle /> 开始错题练习
          </button>
          <button
            onClick={handleSelectAll}
            disabled={filteredQuestions.length === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md shadow-sm disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            <FaCheck />{" "}
            {selectedQuestions.size === filteredQuestions.length &&
            filteredQuestions.length > 0
              ? "取消全选"
              : "全选当前"}{" "}
            ({selectedQuestions.size})
          </button>
          <button
            onClick={generateExplanationsForSelected}
            disabled={
              selectedQuestions.size === 0 || generatingExplanations.size > 0
            }
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md shadow-sm disabled:bg-gray-400 dark:disabled:bg-gray-500 flex items-center gap-2 transition-colors"
          >
            <FaRobot /> AI生成解析{" "}
            {generatingExplanations.size > 0
              ? `(${generatingExplanations.size}进行中)`
              : ""}
          </button>
          <button
            onClick={handleGenerateSimilarQuestions}
            disabled={
              selectedQuestions.size === 0 || generatingSimilarQuestions
            }
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md shadow-sm disabled:bg-gray-400 dark:disabled:bg-gray-500 flex items-center gap-2 transition-colors"
          >
            <FaSyncAlt /> AI生成相似题{" "}
            {generatingSimilarQuestions ? "(生成中...)" : ""}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as "options" | "list")}
            className="px-3 py-2 text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="options">卡片视图</option>
            <option value="list">列表视图</option>
          </select>
          <button
            onClick={handleClearRecords}
            disabled={records.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm disabled:bg-gray-400 dark:disabled:bg-gray-500 flex items-center gap-2 transition-colors"
          >
            <FaTrash /> 清空错题本
          </button>
        </div>
      </div>

      {/* 搜索和过滤栏 */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="搜索题目内容、选项、解析..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500 shadow-sm"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        </div>
        <select
          value={filterBankId}
          onChange={(e) => setFilterBankId(e.target.value)}
          className="px-3 py-2 text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500 shadow-sm sm:w-auto w-full"
        >
          <option value="all">所有题库</option>
          {questionBanks.map((bank) => (
            <option key={bank.id} value={bank.id}>
              {bank.name}
            </option>
          ))}
        </select>
      </div>

      {/* 题目列表 */}
      {filteredQuestions.length === 0 && (
        <div className="text-center py-10">
          <FaListUl className="mx-auto text-5xl text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-400">
            没有找到符合条件的错题。
          </p>
          {wrongQuestions.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-500">
              尝试调整搜索词或筛选条件。
            </p>
          )}
          {wrongQuestions.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-500">
              太棒了，当前没有错题！
            </p>
          )}
        </div>
      )}

      <div
        className={`grid gap-4 ${
          viewMode === "options"
            ? "md:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1"
        }`}
      >
        {filteredQuestions.map(
          (q) =>
            q && (
              <WrongQuestionItem
                key={q.id}
                question={q}
                formatDate={formatDate}
                isSelected={selectedQuestions.has(q.id)}
                onSelect={() => handleSelectQuestion(q)}
                isGeneratingExplanation={generatingExplanations.has(q.id)}
              />
            )
        )}
      </div>

      {/* Render SimilarQuestionsModal */}
      <SimilarQuestionsModal
        isOpen={isSimilarQuestionsModalOpen}
        onClose={() => toggleSimilarQuestionsModal(false)}
        originalQuestions={selectedOriginalQuestionsForSimilarity}
        generatedQuestions={similarQuestionsList}
        isLoading={generatingSimilarQuestions}
        availableBanks={questionBanks}
        onImport={async (questionsToImport, bankId) => {
          const result = await importGeneratedQuestions(
            questionsToImport,
            bankId
          );
          if (result.success) {
            alert(
              `成功导入 ${result.importedCount} 道题目。${
                result.skippedCount > 0
                  ? `跳过 ${result.skippedCount} 道重复题目。`
                  : ""
              }`
            );
          } else {
            alert(`导入失败: ${result.error || "未知错误"}`);
          }
        }}
      />
    </div>
  );
}
