"use client";

import { BankDetailHeader } from "@/components/quiz/banks/BankDetailHeader";
import { BankFilters } from "@/components/quiz/banks/BankFilters";
import { QuestionList } from "@/components/quiz/banks/QuestionList";
import QuestionFormModal from "@/components/QuestionFormModal";
import { FaArrowLeft } from "react-icons/fa";
import { useBankDetailPage } from "./useBankDetailPage";

/**
 * Bank detail page for managing questions in a specific bank
 */
export default function BankDetailPage() {
  const {
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
  } = useBankDetailPage();

  if (!bank) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8 flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold text-red-500 dark:text-red-400 mb-4">
          {t("practice.bankNotFound")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">{t("bankManage.selectBankPrompt")}</p>
        <button
          onClick={() => router.push("/quiz")}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center"
        >
          <FaArrowLeft className="mr-2" /> {t("bankManage.backToList")}
        </button>
      </div>
    );
  }

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
        onSave={async (_, questionData, questionId) => {
          if (questionId) {
            await updateQuestionInBank(bankId, questionId, questionData);
          } else {
            await addQuestionToBank(bankId, questionData);
          }
          handleCloseModal();
        }}
      />
    </div>
  );
}
