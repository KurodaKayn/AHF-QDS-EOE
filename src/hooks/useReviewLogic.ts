import { useState, useMemo } from "react";
import { WrongQuestionDisplay } from "@/components/quiz/WrongQuestionItem";

interface UseReviewLogicProps {
  wrongQuestions: WrongQuestionDisplay[];
  filterBankId: string | "all";
  searchTerm: string;
  currentExplanations: Record<string, string>;
  completedExplanations: Record<string, string>;
}

/**
 * Review Page Business Logic Hook
 * Handles question filtering, searching, and selection state management
 */
export function useReviewLogic({
  wrongQuestions,
  filterBankId,
  searchTerm,
  currentExplanations,
  completedExplanations,
}: UseReviewLogicProps) {
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(
    new Set()
  );

  /**
   * Search and filter questions
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
   * Handle question selection/deselection
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
   * Select all / Deselect all
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
   * Clear selection
   */
  const clearSelection = () => {
    setSelectedQuestions(new Set());
  };

  /**
   * Get selected questions list
   */
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
