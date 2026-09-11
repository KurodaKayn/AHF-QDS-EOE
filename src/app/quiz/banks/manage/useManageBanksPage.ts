import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { DeleteType } from "@/components/quiz/manage/DeleteConfirmDialog";
import { findDuplicateQuestionsInBank, useQuizStore, type Question } from "@/model/quiz";

export function useManageBanksPage(initialTempBankId: string | null) {
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

  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isCreateBankModalOpen, setIsCreateBankModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [isNoDuplicatesModalOpen, setIsNoDuplicatesModalOpen] = useState(false);
  const [deleteConfirmType, setDeleteConfirmType] = useState<DeleteType>("bank");
  const [questionToDelete, setQuestionToDelete] = useState<{ id: string; content: string } | null>(
    null,
  );
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [duplicateGroups, setDuplicateGroups] = useState<Map<string, Question[]>>(new Map());

  const banks = questionBanks || [];

  const selectedBank = useMemo(() => {
    if (!selectedBankId) return null;
    return getQuestionBankById(selectedBankId) || null;
  }, [selectedBankId, getQuestionBankById]);

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
      // silent
    }
  }, [initialTempBankId, questionBanks]);

  useEffect(() => {
    if (selectedBankId && !(questionBanks || []).find((b) => b.id === selectedBankId)) {
      setSelectedBankId(null);
    }
  }, [selectedBankId, questionBanks]);

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

  const handleCreateNewBank = () => setIsCreateBankModalOpen(true);

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
    toast.success(t("bankManage.alerts.duplicatesDeleted", { count: selectedIds.size }));
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

  const handleSaveQuestion = async (
    bankId: string,
    questionData: any,
    questionId?: string | null,
  ) => {
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
  };

  return {
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
  };
}
