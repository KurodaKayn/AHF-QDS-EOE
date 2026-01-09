"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuizStore } from "@/store/quizStore";
import { Question, QuestionType } from "@/types/quiz";
import { BankDetailHeader } from "@/components/quiz/banks/BankDetailHeader";
import { BankFilters } from "@/components/quiz/banks/BankFilters";
import { QuestionList } from "@/components/quiz/banks/QuestionList";
import { QuestionFormModal } from "@/components/quiz/banks/QuestionFormModal";
import { FaArrowLeft } from "react-icons/fa";

/**
 * 题库详情页面，用于管理特定题库中的题目
 */
export default function BankDetailPage() {
  const router = useRouter();
  const params = useParams();
  // 确保 bankId 总是字符串
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

  const handleSaveQuestion = (questionData: Omit<Question, "id">) => {
    if (isEditModalOpen && editingQuestion) {
      updateQuestionInBank(bankId, editingQuestion.id, questionData);
    } else {
      addQuestionToBank(bankId, questionData);
    }
    handleCloseModal();
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (confirm("确定要删除这个题目吗？此操作无法撤销。")) {
      deleteQuestionFromBank(bankId, questionId);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterType("all");
  };

  // 如果题库不存在，显示错误页
  if (!bank) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8 flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold text-red-500 dark:text-red-400 mb-4">
          题库不存在
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          您请求的题库未找到，可能已被删除或 ID 无效。
        </p>
        <button
          onClick={() => router.push("/quiz")}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center"
        >
          <FaArrowLeft className="mr-2" /> 返回题库列表
        </button>
      </div>
    );
  }

  // 过滤和排序题目
  const filteredQuestions = bank.questions
    .filter((q) => {
      // 先按照题目类型筛选
      if (filterType !== "all" && q.type !== filterType) {
        return false;
      }

      // 再按照搜索条件筛选
      if (!searchTerm) return true;

      // 搜索题目内容、选项和解析
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
      // 按照更新时间排序
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
        isEdit={isEditModalOpen}
        question={editingQuestion}
        onClose={handleCloseModal}
        onSave={handleSaveQuestion}
      />
    </div>
  );
}
