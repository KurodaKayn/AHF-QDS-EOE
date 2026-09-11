import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuizStore } from "@/store/quizStore";
import type { Question } from "@/model/quiz";
import type { WrongQuestionDisplay } from "@/components/quiz/WrongQuestionItem";
import { useTranslation } from "react-i18next";
import { useAiExplanation } from "./useAiExplanation";
import { useReviewLogic } from "./useReviewLogic";

/**
 * Hook encapsulating all state, aggregation, and action logic for ReviewPage.
 * Co-located with ReviewPage.
 */
export function useReviewPage() {
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
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterBankId, setFilterBankId] = useState<string | "all">("all");
  const [viewMode, setViewMode] = useState<"options" | "list">("options");

  const {
    generatingExplanations,
    aiError,
    currentExplanations,
    completedExplanations,
    setAiError,
    generateExplanation,
    cleanupExplanations,
  } = useAiExplanation();

  const wrongQuestions = useMemo(() => {
    const wrongRecords = records.filter((record) => !record.isCorrect);
    const questions = wrongRecords
      .map((record) => {
        for (const bank of questionBanks) {
          const question = bank.questions.find((q) => q.id === record.questionId);
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

  const {
    filteredQuestions,
    selectedQuestions,
    handleSelectQuestion,
    handleSelectAll,
    clearSelection,
    getSelectedQuestions,
  } = useReviewLogic({
    wrongQuestions,
    filterBankId,
    searchTerm,
    currentExplanations,
    completedExplanations,
  });

  useEffect(() => {
    const validIds = new Set(filteredQuestions.map((q) => q.id));
    cleanupExplanations(validIds);
  }, [filteredQuestions, cleanupExplanations]);

  const handleStartPractice = () => {
    const wrongRecs = records.filter((record) => !record.isCorrect);
    if (wrongRecs.length === 0) {
      toast.info(t("review.alerts.noWrongQuestions"));
      return;
    }
    const bankWithWrong = questionBanks.find((bank) =>
      bank.questions.some((q) => wrongRecs.some((r) => r.questionId === q.id)),
    );
    if (bankWithWrong) {
      router.push(`/quiz/practice?bankId=${bankWithWrong.id}&mode=review`);
    } else {
      toast.warning(t("review.alerts.noBankWithWrong"));
    }
  };

  const handleClearRecords = async () => {
    if (confirm(t("review.alerts.confirmClear"))) {
      await clearRecords();
      clearSelection();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("zh-CN");
  };

  const generateExplanationsForSelected = async () => {
    if (selectedQuestions.size === 0) {
      toast.warning(t("review.alerts.selectToExplain"));
      return;
    }

    const { aiConfigs, activeAiConfigId } = settings;
    const activeConfig = aiConfigs.find((c) => c.id === activeAiConfigId);

    if (!activeConfig) {
      setAiError(t("review.ai.noModel"));
      return;
    }

    setAiError(null);
    const selectedItems = getSelectedQuestions();

    for (const questionInfo of selectedItems) {
      await generateExplanation(questionInfo, activeConfig, async (questionId, explanation) => {
        if (questionInfo.bankId) {
          await updateQuestionInBank(questionInfo.bankId, questionId, {
            explanation,
          });
        }
      });
    }
  };

  const handleGenerateSimilarQuestions = async () => {
    if (selectedQuestions.size === 0) {
      toast.warning(t("review.alerts.selectToSimilar"));
      return;
    }
    const selectedItems = getSelectedQuestions();
    if (selectedItems.length === 0) {
      toast.warning(t("review.alerts.noDetailsFound"));
      return;
    }

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
    }));

    setSelectedOriginalQuestionsForSimilarity(questionsForAI);
    await generateSimilarQuestions(questionsForAI);
  };

  return {
    t,
    router,
    questionBanks,
    searchTerm,
    setSearchTerm,
    filterBankId,
    setFilterBankId,
    viewMode,
    setViewMode,
    wrongQuestions,
    filteredQuestions,
    selectedQuestions,
    generatingExplanations,
    aiError,
    setAiError,
    currentExplanations,
    handleSelectQuestion,
    handleSelectAll,
    handleStartPractice,
    handleClearRecords,
    formatDate,
    generateExplanationsForSelected,
    handleGenerateSimilarQuestions,
    totalRecordsCount: records.length,
    isSimilarQuestionsModalOpen,
    generatingSimilarQuestions,
    similarQuestionsList,
    selectedOriginalQuestionsForSimilarity,
    toggleSimilarQuestionsModal,
    importGeneratedQuestions,
  };
}
