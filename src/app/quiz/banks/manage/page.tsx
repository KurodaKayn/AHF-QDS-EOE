"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuizStore } from "@/store/quizStore";
import { Question } from "@/types/quiz";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FaArrowLeft, FaEdit, FaRegTrashAlt } from "react-icons/fa";
import { toast } from "sonner";
import QuestionFormModal from "@/components/QuestionFormModal";
import CreateBankModal from "@/components/CreateBankModal";
import { BeatLoader } from "react-spinners";
import { useThemeStore } from "@/store/themeStore";
import { useTranslation } from "react-i18next";
import { BankSelector, SortType } from "@/components/quiz/manage/BankSelector";
import { QuestionListSection } from "@/components/quiz/manage/QuestionListSection";
import { DuplicateQuestionsModal } from "@/components/quiz/manage/DuplicateQuestionsModal";
import {
  DeleteConfirmDialog,
  DeleteType,
} from "@/components/quiz/manage/DeleteConfirmDialog";
import { NoDuplicatesDialog } from "@/components/quiz/manage/NoDuplicatesDialog";
import { findDuplicateQuestions } from "@/utils/duplicateDetection";

// Helper component for static export paths
const ManageIndexPage = () => {
  return (
    <div className="hidden">
      <h1>题库管理页面</h1>
      <p>如果看到这个页面，说明页面加载中或发生了错误。</p>
    </div>
  );
};

// Client component that uses useSearchParams() through props
function ManageBanksPageContent({
  initialTempBankId,
}: {
  initialTempBankId: string | null;
}) {
  const router = useRouter();
  const {
    questionBanks,
    getQuestionBankById,
    addQuestionBank,
    updateQuestionBank,
    deleteQuestionBank,
    deleteQuestionFromBank,
  } = useQuizStore();
  const { t } = useTranslation();

  // State
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [isEditingBankDetails, setIsEditingBankDetails] = useState(false);
  const [editBankName, setEditBankName] = useState("");
  const [editBankDescription, setEditBankDescription] = useState("");
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isCreateBankModalOpen, setIsCreateBankModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] =
    useState(false);
  const [isNoDuplicatesModalOpen, setIsNoDuplicatesModalOpen] = useState(false);
  const [deleteConfirmType, setDeleteConfirmType] =
    useState<DeleteType>("bank");
  const [questionToDelete, setQuestionToDelete] = useState<{
    id: string;
    content: string;
  } | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [sortType, setSortType] = useState<SortType>(SortType.NameAsc);
  const [duplicateGroups, setDuplicateGroups] = useState<
    Map<string, Question[]>
  >(new Map());

  // Sorted banks
  const sortedBanks = useMemo(() => {
    if (!questionBanks) return [];
    return [...questionBanks].sort((a, b) => {
      switch (sortType) {
        case SortType.NameAsc:
          return a.name.localeCompare(b.name);
        case SortType.NameDesc:
          return b.name.localeCompare(a.name);
        case SortType.DateAsc:
          return (a.createdAt || 0) - (b.createdAt || 0);
        case SortType.DateDesc:
          return (b.createdAt || 0) - (a.createdAt || 0);
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [questionBanks, sortType]);

  // Selected bank
  const selectedBank = useMemo(() => {
    if (!selectedBankId) return null;
    return getQuestionBankById(selectedBankId) || null;
  }, [selectedBankId, getQuestionBankById, questionBanks]);

  // Initialize with URL parameter
  useEffect(() => {
    try {
      if (
        initialTempBankId &&
        questionBanks &&
        questionBanks.some((bank) => bank.id === initialTempBankId)
      ) {
        setSelectedBankId(initialTempBankId);
      }
    } catch (error) {
      console.error("处理题库ID出错:", error);
    }
  }, [initialTempBankId, questionBanks]);

  // Reset selection if bank is deleted
  useEffect(() => {
    if (
      selectedBankId &&
      !(questionBanks || []).find((b) => b.id === selectedBankId)
    ) {
      setSelectedBankId(null);
    }
  }, [selectedBankId, questionBanks]);

  // Sync edit state when selected bank changes
  useEffect(() => {
    if (selectedBank) {
      setEditBankName(selectedBank.name);
      setEditBankDescription(selectedBank.description || "");
      setIsEditingBankDetails(false);
    } else {
      setEditBankName("");
      setEditBankDescription("");
      setIsEditingBankDetails(false);
    }
  }, [selectedBank]);

  // Handlers
  const handleSaveBankDetails = () => {
    if (!selectedBank || !editBankName.trim()) {
      toast.error(t("bankManage.alerts.bankNameRequired"));
      return;
    }
    updateQuestionBank(
      selectedBank.id,
      editBankName.trim(),
      editBankDescription.trim()
    );
    toast.success(
      t("bankManage.alerts.bankUpdated", { name: editBankName.trim() })
    );
    setIsEditingBankDetails(false);
  };

  const handleSelectBank = (bankId: string) => {
    if (bankId === "__new__") {
      setSelectedBankId(null);
    } else {
      setSelectedBankId(bankId);
      setIsQuestionModalOpen(false);
      setEditingQuestion(null);
    }
  };

  const handleUpdateBank = (name: string, description: string) => {
    if (!selectedBank) return;
    updateQuestionBank(selectedBank.id, name, description);
    toast.success(t("bankManage.alerts.bankUpdated", { name }));
  };

  const handleCreateNewBank = () => {
    setIsCreateBankModalOpen(true);
  };

  const handleCreateBankSubmit = (name: string, description: string) => {
    const newBank = addQuestionBank(name, description);
    if (newBank && typeof newBank === "object" && "id" in newBank) {
      setSelectedBankId(newBank.id);
      toast.success(t("bankManage.alerts.bankCreated", { name }));
    } else if (newBank && typeof newBank === "string") {
      setSelectedBankId(newBank);
      toast.success(t("bankManage.alerts.bankCreated", { name }));
    } else {
      toast.success(t("bankManage.alerts.bankCreated", { name }));
    }
  };

  const handleDeleteCurrentBank = () => {
    if (!selectedBank) return;
    setDeleteConfirmType("bank");
    setIsDeleteConfirmModalOpen(true);
  };

  const handleDeleteQuestion = (
    questionId: string,
    questionContent: string
  ) => {
    if (!selectedBank) return;
    setDeleteConfirmType("question");
    setQuestionToDelete({ id: questionId, content: questionContent });
    setIsDeleteConfirmModalOpen(true);
  };

  const handleOpenAddQuestionModal = () => {
    setEditingQuestion(null);
    setIsQuestionModalOpen(true);
  };

  const handleOpenEditQuestionModal = (questionId: string) => {
    if (!selectedBank) return;
    const question = selectedBank.questions?.find((q) => q.id === questionId);
    if (question) {
      setEditingQuestion(question);
      setIsQuestionModalOpen(true);
    }
  };

  const handleQuestionModalClose = () => {
    setIsQuestionModalOpen(false);
    setEditingQuestion(null);
  };

  const handleFindDuplicates = () => {
    if (
      !selectedBank ||
      !selectedBank.questions ||
      selectedBank.questions.length < 2
    ) {
      setIsNoDuplicatesModalOpen(true);
      return;
    }

    const duplicates = findDuplicateQuestions(selectedBank.questions);
    if (duplicates.size === 0) {
      setIsNoDuplicatesModalOpen(true);
      return;
    }

    setDuplicateGroups(duplicates);
    setIsDuplicateModalOpen(true);
  };

  const handleDeleteSelectedDuplicates = (selectedIds: Set<string>) => {
    if (!selectedBank || selectedIds.size === 0) return;

    selectedIds.forEach((questionId) => {
      deleteQuestionFromBank(selectedBank.id, questionId);
    });

    toast.success(
      t("bankManage.alerts.duplicatesDeleted", {
        count: selectedIds.size,
      })
    );

    setIsDuplicateModalOpen(false);
  };

  const confirmDelete = () => {
    if (!selectedBank) return;

    switch (deleteConfirmType) {
      case "bank":
        deleteQuestionBank(selectedBank.id);
        toast.success(
          t("bankManage.alerts.bankDeleted", { name: selectedBank.name })
        );
        setSelectedBankId(null);
        break;
      case "question":
        if (questionToDelete) {
          deleteQuestionFromBank(selectedBank.id, questionToDelete.id);
          toast.success(t("bankManage.alerts.questionDeleted"));
        }
        break;
    }

    setIsDeleteConfirmModalOpen(false);
  };

  if (questionBanks === undefined) {
    return (
      <div className="container mx-auto p-4 md:p-8 min-h-screen flex justify-center items-center dark:bg-gray-900">
        <p className="text-xl text-gray-500 dark:text-gray-400">
          {t("bankManage.loading")}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen dark:bg-gray-900">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
              {t("bankManage.pageTitle")}
            </CardTitle>
            <Button
              variant="outline"
              onClick={() => router.push("/quiz")}
              size="sm"
            >
              <FaArrowLeft className="mr-2" />
              {t("bankManage.backToList")}
            </Button>
          </div>
          <CardDescription className="dark:text-gray-400">
            {t("bankManage.pageSubtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <BankSelector
            banks={sortedBanks}
            selectedBankId={selectedBankId}
            sortType={sortType}
            onSelectBank={handleSelectBank}
            onCreateNew={handleCreateNewBank}
            onSortChange={setSortType}
          />

          {selectedBank ? (
            <>
              <div className="border-t dark:border-gray-700 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl md:text-2xl font-semibold text-blue-700 dark:text-blue-400">
                    {t("bankManage.bankLabel")}: {selectedBank.name}
                  </h2>
                  <div className="flex gap-2">
                    {!isEditingBankDetails && (
                      <Button
                        variant="outline"
                        onClick={() => setIsEditingBankDetails(true)}
                        size="sm"
                      >
                        <FaEdit className="mr-2" /> {t("bankManage.editInfo")}
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      onClick={handleDeleteCurrentBank}
                      size="sm"
                    >
                      <FaRegTrashAlt className="mr-2" />{" "}
                      {t("bankManage.deleteBank")}
                    </Button>
                  </div>
                </div>

                {isEditingBankDetails ? (
                  <div className="space-y-4 pb-6 mb-6 border-b dark:border-gray-700">
                    <div>
                      <label
                        htmlFor="bankName"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        {t("bankManage.bankName")}
                      </label>
                      <Input
                        id="bankName"
                        value={editBankName}
                        onChange={(e) => setEditBankName(e.target.value)}
                        placeholder={t("bankManage.bankNamePlaceholder")}
                        className="text-base"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="bankDescription"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        {t("bankManage.bankDescription")}
                      </label>
                      <Textarea
                        id="bankDescription"
                        value={editBankDescription}
                        onChange={(e) => setEditBankDescription(e.target.value)}
                        placeholder={t("bankManage.bankDescPlaceholder")}
                        rows={3}
                        className="text-base"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditingBankDetails(false)}
                        size="sm"
                      >
                        {t("bankManage.cancel")}
                      </Button>
                      <Button onClick={handleSaveBankDetails} size="sm">
                        {t("bankManage.saveChanges")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 pb-6 mb-6 border-b dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-300">
                      <span className="font-semibold text-gray-700 dark:text-gray-200">
                        {t("bankManage.description")}:
                      </span>{" "}
                      {selectedBank.description ||
                        t("bankManage.noDescription")}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">
                      <span className="font-semibold text-gray-700 dark:text-gray-200">
                        {t("bankManage.questionCount")}:
                      </span>{" "}
                      {selectedBank.questions
                        ? selectedBank.questions.length
                        : 0}{" "}
                      {t("bankManage.questionUnit")}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">
                      <span className="font-semibold text-gray-700 dark:text-gray-200">
                        {t("bankManage.createdAt")}
                      </span>{" "}
                      {selectedBank.createdAt
                        ? new Date(selectedBank.createdAt).toLocaleString()
                        : t("bankManage.unknown")}
                    </p>
                  </div>
                )}

                <QuestionListSection
                  questions={selectedBank.questions || []}
                  onAddQuestion={handleOpenAddQuestionModal}
                  onEditQuestion={handleOpenEditQuestionModal}
                  onDeleteQuestion={handleDeleteQuestion}
                  onFindDuplicates={handleFindDuplicates}
                />
              </div>
            </>
          ) : questionBanks && questionBanks.length > 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {t("bankManage.selectBankPrompt")}
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {t("bankManage.noBanksPrompt")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <NoDuplicatesDialog
        isOpen={isNoDuplicatesModalOpen}
        hasEnoughQuestions={
          selectedBank !== null &&
          selectedBank.questions !== undefined &&
          selectedBank.questions.length >= 2
        }
        onClose={() => setIsNoDuplicatesModalOpen(false)}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteConfirmModalOpen}
        deleteType={deleteConfirmType}
        bankName={selectedBank?.name}
        questionContent={questionToDelete?.content}
        duplicateCount={0}
        onClose={() => setIsDeleteConfirmModalOpen(false)}
        onConfirm={confirmDelete}
      />

      <DuplicateQuestionsModal
        isOpen={isDuplicateModalOpen}
        duplicateGroups={duplicateGroups}
        onClose={() => setIsDuplicateModalOpen(false)}
        onDeleteSelected={handleDeleteSelectedDuplicates}
      />

      <CreateBankModal
        isOpen={isCreateBankModalOpen}
        onClose={() => setIsCreateBankModalOpen(false)}
        onSubmit={handleCreateBankSubmit}
      />

      {selectedBankId && (
        <QuestionFormModal
          isOpen={isQuestionModalOpen}
          onClose={handleQuestionModalClose}
          bankId={selectedBankId}
          questionToEdit={editingQuestion}
          onSubmitSuccess={() => {
            handleQuestionModalClose();
          }}
        />
      )}
    </div>
  );
}

// Main page component, optimized for static export
export default function ManageBanksPage() {
  const { theme } = useThemeStore();

  // Safely get URL parameters on client side
  const [initialTempBankId, setInitialTempBankId] = useState<string | null>(
    null
  );

  useEffect(() => {
    // Add static path markers to help the build system identify paths
    const paths = [
      "/quiz/banks/manage/",
      "/quiz/banks/manage/index.html",
      "/quiz/banks/manage/index",
      "/quiz/banks/manage",
    ];
    console.log("可用的静态路径:", paths);

    if (typeof window !== "undefined") {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        // Check bankId parameter first (direct entry from bank list)
        const bankId = urlParams.get("bankId");
        if (bankId) {
          setInitialTempBankId(bankId);
          // Clean URL to avoid repeated loading
          const url = new URL(window.location.href);
          url.searchParams.delete("bankId");
          window.history.replaceState({}, "", url.toString());
          return;
        }

        // Compatible with original tempBankId parameter
        const tempBankId = urlParams.get("tempBankId");
        if (tempBankId) {
          setInitialTempBankId(tempBankId);
          // Clean URL to avoid repeated loading
          const url = new URL(window.location.href);
          url.searchParams.delete("tempBankId");
          window.history.replaceState({}, "", url.toString());
        }
      } catch (error) {
        console.error("获取URL参数出错:", error);
      }
    }
  }, []);

  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col justify-center items-center dark:bg-gray-900">
          <BeatLoader color={theme === "dark" ? "#38BDF8" : "#3B82F6"} />
          <p className="text-xl text-gray-500 dark:text-gray-400 mt-4">
            加载管理界面...
          </p>
        </div>
      }
    >
      {/* Add hidden link elements to help static export system identify routes */}
      <div style={{ display: "none" }}>
        <a href="/quiz/banks/manage">管理题库</a>
        <a href="/quiz/banks/manage/">管理题库带斜杠</a>
        <a href="/quiz/banks/manage/index.html">管理题库HTML</a>
      </div>
      <ManageBanksPageContent initialTempBankId={initialTempBankId} />
    </Suspense>
  );
}
