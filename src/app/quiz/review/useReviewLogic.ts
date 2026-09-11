import { useState, useMemo } from "react";
import type { WrongQuestionDisplay } from "@/model/quiz";

interface UseReviewLogicProps {
  wrongQuestions: WrongQuestionDisplay[];
  filterBankId: string | "all";
  searchTerm: string;
  currentExplanations: Record<string, string>;
  completedExplanations: Record<string, string>;
}

/**
 * Review Page Business Logic Hook.
 * Co-located with ReviewPage.
 */
export function useReviewLogic({
  wrongQuestions,
  filterBankId,
  searchTerm,
  currentExplanations,
  completedExplanations,
}: UseReviewLogicProps) {
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());

  const filteredQuestions = useMemo(() => {
    return wrongQuestions.filter((q) => {
      if (filterBankId !== "all" && q?.bankId !== filterBankId) return false;
      if (searchTerm && q) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return (
          q.content.toLowerCase().includes(lowerSearchTerm) ||
          (q.options?.some((opt) => opt.content.toLowerCase().includes(lowerSearchTerm)) ??
            false) ||
          (q.explanation?.toLowerCase().includes(lowerSearchTerm) ?? false) ||
          (currentExplanations[q.id]?.toLowerCase().includes(lowerSearchTerm) ?? false) ||
          (completedExplanations[q.id]?.toLowerCase().includes(lowerSearchTerm) ?? false)
        );
      }
      return true;
    });
  }, [wrongQuestions, filterBankId, searchTerm, currentExplanations, completedExplanations]);

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

  const handleSelectAll = () => {
    if (selectedQuestions.size === filteredQuestions.length && filteredQuestions.length > 0) {
      setSelectedQuestions(new Set());
    } else {
      const newSelected = new Set<string>();
      filteredQuestions.forEach((q) => {
        if (q) newSelected.add(q.id);
      });
      setSelectedQuestions(newSelected);
    }
  };

  const clearSelection = () => {
    setSelectedQuestions(new Set());
  };

  const getSelectedQuestions = () => {
    return wrongQuestions.filter((q) => selectedQuestions.has(q.id));
  };

  return {
    filteredQuestions,
    selectedQuestions,
    handleSelectQuestion,
    handleSelectAll,
    clearSelection,
    getSelectedQuestions,
  };
}
