"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuizStore } from "@/store/quizStore";
import { Question, QuestionType } from "@/types/quiz";
import { BankDetailHeader } from "@/components/quiz/banks/BankDetailHeader";
import { BankFilters } from "@/components/quiz/banks/BankFilters";
import { QuestionList } from "@/components/quiz/banks/QuestionList";
import QuestionFormModal from "@/components/QuestionFormModal";
import { FaArrowLeft } from "react-icons/fa";
import { useTranslation } from "react-i18next";

/**
 * Bank detail page for managing questions in a specific bank
 */
export default function BankDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();

  // Ensure bankId is always a string
  const bankId = Array.isArray(params.bankId)
    ? params.bankId[0] || ""
    : params.bankId || "";

  const {
    getQuestionBankById,
    updateQuestionInBank,
    deleteQuestionFromBank,
    addQuestionToBank,
  } = useQuizStore();

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

  const handleDeleteQuestion = (questionId: string) => {
    if (
      confirm(
        t("bankManage.deleteConfirm.questionMessage", { content: "" }).replace(
          '""',
          ""
        )
      )
    ) {
      deleteQuestionFromBank(bankId, questionId);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterType("all");
  };

  // If bank not found, show error page
  if (!bank) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8 flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold text-red-500 dark:text-red-400 mb-4">
          {t("practice.bankNotFound")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {t("bankManage.selectBankPrompt")}
        </p>
        <button
          onClick={() => router.push("/quiz")}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center"
        >
          <FaArrowLeft className="mr-2" /> {t("bankManage.backToList")}
        </button>
      </div>
    );
  }

  // Filter and sort questions
  const filteredQuestions = bank.questions
    .filter((q) => {
      // Filter by type
      if (filterType !== "all" && q.type !== filterType) {
        return false;
      }

      // Filter by search term
      if (!searchTerm) return true;

      // Search in content, explanation and options
      const searchLower = searchTerm.toLowerCase();
      return (
        q.content.toLowerCase().includes(searchLower) ||
        (q.explanation?.toLowerCase() || "").includes(searchLower) ||
        (q.options || []).some((opt) =>
          opt.content.toLowerCase().includes(searchLower)
        )
      );
    })
    .sort((a, b) => {
      // Sort by update time
      if (sortOrder === "asc") {
        return a.updatedAt - b.updatedAt;
      } else {
        return b.updatedAt - a.updatedAt;
      }
    });

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      <BankDetailHeader
        bank={bank}
        onBack={() => router.push("/quiz")}
        onAddQuestion={handleOpenAddModal}
      />

      <BankFilters
        searchTerm={searchTerm}
        filterType={filterType}
        sortOrder={sortOrder}
        onSearchChange={setSearchTerm}
        onFilterChange={setFilterType}
        onSortToggle={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
      />

      <QuestionList
        questions={filteredQuestions}
        searchTerm={searchTerm}
        filterType={filterType}
        onEditQuestion={handleOpenEditModal}
        onDeleteQuestion={handleDeleteQuestion}
        onClearFilters={handleClearFilters}
      />

      <QuestionFormModal
        isOpen={isModalOpen || isEditModalOpen}
        bankId={bankId}
        questionToEdit={editingQuestion}
        onClose={handleCloseModal}
        onSave={(_, questionData, questionId) => {
          if (questionId) {
            updateQuestionInBank(bankId, questionId, questionData);
          } else {
            addQuestionToBank(bankId, questionData);
          }
          handleCloseModal();
        }}
      />
    </div>
  );
}
