"use client";

import Link from "next/link";
import { Suspense, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuizStore } from "@/store/quizStore";
import type { Question } from "@/types/quiz";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FaArrowLeft } from "react-icons/fa";
import { toast } from "sonner";
import QuestionFormModal from "@/components/QuestionFormModal";
import CreateBankModal from "@/components/CreateBankModal";
import { BeatLoader } from "react-spinners";
import { useThemeStore } from "@/store/themeStore";
import { useTranslation } from "react-i18next";
import { BankSelector } from "@/components/quiz/manage/BankSelector";
import { BankDetailsCard } from "@/components/quiz/manage/BankDetailsCard";
import { DuplicateQuestionsModal } from "@/components/quiz/manage/DuplicateQuestionsModal";
import type { DeleteType } from "@/components/quiz/manage/DeleteConfirmDialog";
import { DeleteConfirmDialog } from "@/components/quiz/manage/DeleteConfirmDialog";
import { NoDuplicatesDialog } from "@/components/quiz/manage/NoDuplicatesDialog";
import { findDuplicateQuestionsInBank } from "@/model";

// Helper component for static export paths

// Client component that uses useSearchParams() through props
function ManageBanksPageContent({ initialTempBankId }: { initialTempBankId: string | null }) {
  const router = useRouter();
  const {
    questionBanks,
    getQuestionBankById,
    addQuestionBank,
    updateQuestionBank,
    deleteQuestionBank,
    deleteQuestionFromBank,
    addQuestionToBank,
    updateQuestionInBank,
  } = useQuizStore();
  const { t } = useTranslation();

  // State
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isCreateBankModalOpen, setIsCreateBankModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [isNoDuplicatesModalOpen, setIsNoDuplicatesModalOpen] = useState(false);
  const [deleteConfirmType, setDeleteConfirmType] = useState<DeleteType>("bank");
  const [questionToDelete, setQuestionToDelete] = useState<{
    id: string;
    content: string;
  } | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [duplicateGroups, setDuplicateGroups] = useState<Map<string, Question[]>>(new Map());

  // Banks (no sorting needed)
  const banks = questionBanks || [];

  // Selected bank
  const selectedBank = useMemo(() => {
    if (!selectedBankId) return null;
    return getQuestionBankById(selectedBankId) || null;
  }, [selectedBankId, getQuestionBankById]);

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
    } catch {
      // toast.error("Error processing bank ID");
    }
  }, [initialTempBankId, questionBanks]);

  // Reset selection if bank is deleted
  useEffect(() => {
    if (selectedBankId && !(questionBanks || []).find((b) => b.id === selectedBankId)) {
      setSelectedBankId(null);
    }
  }, [selectedBankId, questionBanks]);

  // Handlers
  const handleSaveBankDetails = async (name: string, description: string) => {
    if (!selectedBank || !name.trim()) {
      toast.error(t("bankManage.alerts.bankNameRequired"));
      return;
    }
    await updateQuestionBank(selectedBank.id, name.trim(), description.trim());
    toast.success(t("bankManage.alerts.bankUpdated", { name: name.trim() }));
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

  const handleCreateNewBank = () => {
    setIsCreateBankModalOpen(true);
  };

  const handleCreateBankSubmit = async (name: string, description: string) => {
    const newBank = await addQuestionBank(name, description);
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

  const handleDeleteQuestion = (questionId: string, questionContent: string) => {
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

  const handleFindDuplicates = async () => {
    if (!selectedBank || !selectedBank.questions || selectedBank.questions.length < 2) {
      setIsNoDuplicatesModalOpen(true);
      return;
    }

    const duplicates = await findDuplicateQuestionsInBank(selectedBank.id, selectedBank.questions);
    if (duplicates.size === 0) {
      setIsNoDuplicatesModalOpen(true);
      return;
    }

    setDuplicateGroups(duplicates);
    setIsDuplicateModalOpen(true);
  };

  const handleDeleteSelectedDuplicates = async (selectedIds: Set<string>) => {
    if (!selectedBank || selectedIds.size === 0) return;

    for (const questionId of selectedIds) {
      await deleteQuestionFromBank(selectedBank.id, questionId);
    }

    toast.success(
      t("bankManage.alerts.duplicatesDeleted", {
        count: selectedIds.size,
      }),
    );

    setIsDuplicateModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!selectedBank) return;

    switch (deleteConfirmType) {
      case "bank":
        await deleteQuestionBank(selectedBank.id);
        toast.success(t("bankManage.alerts.bankDeleted", { name: selectedBank.name }));
        setSelectedBankId(null);
        break;
      case "question":
        if (questionToDelete) {
          await deleteQuestionFromBank(selectedBank.id, questionToDelete.id);
          toast.success(t("bankManage.alerts.questionDeleted"));
        }
        break;
    }

    setIsDeleteConfirmModalOpen(false);
  };

  if (questionBanks === undefined) {
    return (
      <div className="container mx-auto p-4 md:p-8 min-h-screen flex justify-center items-center dark:bg-gray-900">
        <p className="text-xl text-gray-500 dark:text-gray-400">{t("bankManage.loading")}</p>
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
            <Button variant="outline" onClick={() => router.push("/quiz")} size="sm">
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
            banks={banks}
            selectedBankId={selectedBankId}
            onSelectBank={handleSelectBank}
            onCreateNew={handleCreateNewBank}
          />

          {selectedBank && (
            <BankDetailsCard
              bank={selectedBank}
              onUpdate={handleSaveBankDetails}
              onDelete={handleDeleteCurrentBank}
              onAddQuestion={handleOpenAddQuestionModal}
              onEditQuestion={handleOpenEditQuestionModal}
              onDeleteQuestion={handleDeleteQuestion}
              onFindDuplicates={handleFindDuplicates}
            />
          )}

          {!selectedBank && questionBanks && questionBanks.length > 0 && (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {t("bankManage.selectBankPrompt")}
              </p>
            </div>
          )}

          {!selectedBank && (!questionBanks || questionBanks.length === 0) && (
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
          onSave={async (bankId, questionData, questionId) => {
            if (questionId) {
              const updated = await updateQuestionInBank(bankId, questionId, questionData);
              if (updated) {
                toast.success(t("bankManage.alerts.questionUpdated"));
                return true;
              } else {
                toast.error(t("bankManage.alerts.addQuestionFailed"));
                return false;
              }
            } else {
              const result = await addQuestionToBank(bankId, questionData);
              if (result.isDuplicate) {
                toast.error(t("bankManage.alerts.duplicateError"));
                return false;
              } else if (result.question) {
                toast.success(t("bankManage.alerts.questionAdded"));
                return true;
              } else {
                toast.error(t("bankManage.alerts.addQuestionFailed"));
                return false;
              }
            }
          }}
        />
      )}
    </div>
  );
}

// Main page component, optimized for static export
export default function ManageBanksPage() {
  const { theme } = useThemeStore();
  const { t } = useTranslation();

  // Safely get URL parameters on client side
  const [initialTempBankId, setInitialTempBankId] = useState<string | null>(null);

  useEffect(() => {
    // Add static path markers to help the build system identify paths
    const _paths = [
      "/quiz/banks/manage/",
      "/quiz/banks/manage/index.html",
      "/quiz/banks/manage/index",
      "/quiz/banks/manage",
    ];
    // console.log("Available static paths:", paths);

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
      } catch {
        // console.error("Error getting URL parameters:", error);
      }
    }
  }, []);

  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col justify-center items-center dark:bg-gray-900">
          <BeatLoader color={theme === "dark" ? "#38BDF8" : "#3B82F6"} />
          <p className="text-xl text-gray-500 dark:text-gray-400 mt-4">
            {t("bankManage.loadingInterface", {
              defaultValue: "Loading management interface...",
            })}
          </p>
        </div>
      }
    >
      {/* Add hidden link elements to help static export system identify routes */}
      <div style={{ display: "none" }}>
        <Link href="/quiz/banks/manage">{t("bankManage.pageTitle")}</Link>
        <Link href="/quiz/banks/manage/">{t("bankManage.pageTitle")}</Link>
        <Link href="/quiz/banks/manage/index.html">{t("bankManage.pageTitle")}</Link>
      </div>
      <ManageBanksPageContent initialTempBankId={initialTempBankId} />
    </Suspense>
  );
}
