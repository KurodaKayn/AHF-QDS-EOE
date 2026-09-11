"use client";

import Link from "next/link";
import { Suspense, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FaArrowLeft } from "react-icons/fa";
import { BeatLoader } from "react-spinners";
import { useThemeStore } from "@/model/theme";
import { useTranslation } from "react-i18next";
import { BankSelector } from "@/components/quiz/manage/BankSelector";
import { BankDetailsCard } from "@/components/quiz/manage/BankDetailsCard";
import { DuplicateQuestionsModal } from "@/components/quiz/manage/DuplicateQuestionsModal";
import { DeleteConfirmDialog } from "@/components/quiz/manage/DeleteConfirmDialog";
import { NoDuplicatesDialog } from "@/components/quiz/manage/NoDuplicatesDialog";
import QuestionFormModal from "@/components/QuestionFormModal";
import CreateBankModal from "@/components/CreateBankModal";
import { useManageBanksPage } from "./useManageBanksPage";

function ManageBanksPageContent({ initialTempBankId }: { initialTempBankId: string | null }) {
  const {
    t,
    router,
    questionBanks,
    banks,
    selectedBankId,
    selectedBank,
    isQuestionModalOpen,
    isCreateBankModalOpen,
    setIsCreateBankModalOpen,
    isDuplicateModalOpen,
    setIsDuplicateModalOpen,
    isDeleteConfirmModalOpen,
    setIsDeleteConfirmModalOpen,
    isNoDuplicatesModalOpen,
    setIsNoDuplicatesModalOpen,
    deleteConfirmType,
    questionToDelete,
    editingQuestion,
    duplicateGroups,
    handleSaveBankDetails,
    handleSelectBank,
    handleCreateNewBank,
    handleCreateBankSubmit,
    handleDeleteCurrentBank,
    handleDeleteQuestion,
    handleOpenAddQuestionModal,
    handleOpenEditQuestionModal,
    handleQuestionModalClose,
    handleFindDuplicates,
    handleDeleteSelectedDuplicates,
    confirmDelete,
    handleSaveQuestion,
  } = useManageBanksPage(initialTempBankId);

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
            return await handleSaveQuestion(bankId, questionData, questionId);
          }}
        />
      )}
    </div>
  );
}

export default function ManageBanksPage() {
  const { theme } = useThemeStore();
  const { t } = useTranslation();

  const [initialTempBankId, setInitialTempBankId] = useState<string | null>(null);

  useEffect(() => {
    const _paths = [
      "/quiz/banks/manage/",
      "/quiz/banks/manage/index.html",
      "/quiz/banks/manage/index",
      "/quiz/banks/manage",
    ];

    if (typeof window !== "undefined") {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const bankId = urlParams.get("bankId");
        if (bankId) {
          setInitialTempBankId(bankId);
          const url = new URL(window.location.href);
          url.searchParams.delete("bankId");
          window.history.replaceState({}, "", url.toString());
          return;
        }

        const tempBankId = urlParams.get("tempBankId");
        if (tempBankId) {
          setInitialTempBankId(tempBankId);
          const url = new URL(window.location.href);
          url.searchParams.delete("tempBankId");
          window.history.replaceState({}, "", url.toString());
        }
      } catch {
        // silent
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
      <div style={{ display: "none" }}>
        <Link href="/quiz/banks/manage">{t("bankManage.pageTitle")}</Link>
        <Link href="/quiz/banks/manage/">{t("bankManage.pageTitle")}</Link>
        <Link href="/quiz/banks/manage/index.html">{t("bankManage.pageTitle")}</Link>
      </div>
      <ManageBanksPageContent initialTempBankId={initialTempBankId} />
    </Suspense>
  );
}
