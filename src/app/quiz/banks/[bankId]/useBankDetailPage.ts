import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuizStore, type Question, type QuestionType } from "@/model/quiz";
import { useTranslation } from "react-i18next";

export function useBankDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();

  const bankId = Array.isArray(params.bankId) ? params.bankId[0] || "" : params.bankId || "";

  const { getQuestionBankById, updateQuestionInBank, deleteQuestionFromBank, addQuestionToBank } =
    useQuizStore();

  const bank = getQuestionBankById(bankId);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<QuestionType | "all">("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const handleOpenEditModal = (question: Question) => {
    setEditingQuestion(question);
    setIsEditModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setEditingQuestion(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditModalOpen(false);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (confirm(t("bankManage.deleteConfirm.questionMessage", { content: "" }).replace('""', ""))) {
      await deleteQuestionFromBank(bankId, questionId);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterType("all");
  };

  const filteredQuestions = bank
    ? bank.questions
        .filter((q) => {
          if (filterType !== "all" && q.type !== filterType) return false;
          if (!searchTerm) return true;
          const searchLower = searchTerm.toLowerCase();
          return (
            q.content.toLowerCase().includes(searchLower) ||
            (q.explanation?.toLowerCase() || "").includes(searchLower) ||
            (q.options || []).some((opt) => opt.content.toLowerCase().includes(searchLower))
          );
        })
        .sort((a, b) =>
          sortOrder === "asc" ? a.updatedAt - b.updatedAt : b.updatedAt - a.updatedAt,
        )
    : [];

  return {
    t,
    router,
    bank,
    bankId,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    sortOrder,
    setSortOrder,
    isModalOpen,
    isEditModalOpen,
    editingQuestion,
    filteredQuestions,
    handleOpenEditModal,
    handleOpenAddModal,
    handleCloseModal,
    handleDeleteQuestion,
    handleClearFilters,
    updateQuestionInBank,
    addQuestionToBank,
  };
}
