"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuizStore } from "@/store/quizStore";
import {
  Question,
  QuestionBank,
  QuestionType,
  QuestionOption,
} from "@/types/quiz";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FaPlusCircle,
  FaEdit,
  FaTrash,
  FaArrowLeft,
  FaEye,
  FaRegTrashAlt,
  FaSearch,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaSort,
  FaClock,
  FaClone,
} from "react-icons/fa";
import { toast } from "sonner";
import { QUESTION_TYPE_NAMES } from "@/constants/quiz";
import QuestionFormModal from "@/components/QuestionFormModal";
import CreateBankModal from "@/components/CreateBankModal";
import { BeatLoader } from "react-spinners";
import { useThemeStore } from "@/store/themeStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";

// 创建静态导出路径的辅助组件
const ManageIndexPage = () => {
  // 这个组件的作用是确保静态构建时能生成这个路径
  return (
    <div className="hidden">
      <h1>题库管理页面</h1>
      <p>如果看到这个页面，说明页面加载中或发生了错误。</p>
    </div>
  );
};

// 排序方式枚举
enum SortType {
  NameAsc = "nameAsc",
  NameDesc = "nameDesc",
  DateAsc = "dateAsc",
  DateDesc = "dateDesc",
}

// 题目排序方式枚举
enum QuestionSortType {
  ContentAsc = "contentAsc",
  ContentDesc = "contentDesc",
  TypeAsc = "typeAsc",
  TypeDesc = "typeDesc",
  DateAsc = "dateAsc",
  DateDesc = "dateDesc",
}

// 标准化文本，移除特定标点并转换为小写
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[()（）。.]/g, "") // 去除括号、句号等标点
    .trim();
};

// 查找重复题目
const findDuplicateQuestions = (
  questions: Question[]
): Map<string, Question[]> => {
  const normalizedMap = new Map<string, Question[]>();
  const duplicates = new Map<string, Question[]>();

  // 第一步：按标准化文本将题目分组
  questions.forEach((question) => {
    const normalizedContent = normalizeText(question.content);
    if (!normalizedMap.has(normalizedContent)) {
      normalizedMap.set(normalizedContent, []);
    }
    normalizedMap.get(normalizedContent)?.push(question);
  });

  // 第二步：找出有重复的组
  normalizedMap.forEach((group, normalizedContent) => {
    if (group.length > 1) {
      duplicates.set(normalizedContent, group);
    }
  });

  return duplicates;
};

// 客户端组件，使用 useSearchParams()，但通过父组件提供的 URLSearchParams
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
  const [deleteConfirmType, setDeleteConfirmType] = useState<
    "bank" | "question" | "duplicates"
  >("bank");
  const [questionToDelete, setQuestionToDelete] = useState<{
    id: string;
    content: string;
  } | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortType, setSortType] = useState<SortType>(SortType.NameAsc);
  const [questionSortType, setQuestionSortType] = useState<QuestionSortType>(
    QuestionSortType.ContentAsc
  );
  const [duplicateGroups, setDuplicateGroups] = useState<
    Map<string, Question[]>
  >(new Map());
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<string>>(
    new Set()
  );

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

  const selectedBank = useMemo(() => {
    if (!selectedBankId) return null;
    return getQuestionBankById(selectedBankId) || null;
  }, [selectedBankId, getQuestionBankById, questionBanks]);

  const filteredQuestions = useMemo(() => {
    if (!selectedBank?.questions) return [];

    // 先过滤符合搜索条件的题目
    let filteredResults = selectedBank.questions;
    if (searchQuery.trim()) {
      filteredResults = filteredResults.filter((question) =>
        question.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 然后对结果进行排序
    return [...filteredResults].sort((a, b) => {
      switch (questionSortType) {
        case QuestionSortType.ContentAsc:
          return a.content.localeCompare(b.content);
        case QuestionSortType.ContentDesc:
          return b.content.localeCompare(a.content);
        case QuestionSortType.TypeAsc:
          return a.type.localeCompare(b.type);
        case QuestionSortType.TypeDesc:
          return b.type.localeCompare(a.type);
        case QuestionSortType.DateAsc:
          return (a.createdAt || 0) - (b.createdAt || 0);
        case QuestionSortType.DateDesc:
          return (b.createdAt || 0) - (a.createdAt || 0);
        default:
          return a.content.localeCompare(b.content);
      }
    });
  }, [selectedBank, searchQuery, questionSortType]);

  // 初始化时处理可能的URL参数 - 这里改为通过props接收
  useEffect(() => {
    try {
      if (
        initialTempBankId &&
        questionBanks &&
        questionBanks.some((bank) => bank.id === initialTempBankId)
      ) {
        setSelectedBankId(initialTempBankId);
        // 由于是静态导出，我们不再尝试修改URL
      }
    } catch (error) {
      console.error("处理题库ID出错:", error);
    }
  }, [initialTempBankId, questionBanks]);

  useEffect(() => {
    if (selectedBank) {
      setEditBankName(selectedBank.name);
      setEditBankDescription(selectedBank.description || "");
      setIsEditingBankDetails(false);
    } else {
      setEditBankName("");
      setEditBankDescription("");
      setIsEditingBankDetails(false);
      if (
        selectedBankId &&
        !(questionBanks || []).find((b) => b.id === selectedBankId)
      ) {
        setSelectedBankId(null);
      }
    }
  }, [selectedBank, selectedBankId, questionBanks]);

  const handleSelectBank = (bankId: string) => {
    if (bankId === "__new__") {
      setSelectedBankId(null);
    } else {
      setSelectedBankId(bankId);
      setIsQuestionModalOpen(false);
      setEditingQuestion(null);
    }
  };

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

  const handleOpenEditQuestionModal = (question: Question) => {
    setEditingQuestion(question);
    setIsQuestionModalOpen(true);
  };

  const handleQuestionModalClose = () => {
    setIsQuestionModalOpen(false);
    setEditingQuestion(null);
  };

  // 处理排序变更
  const handleSortChange = (newSortType: SortType) => {
    setSortType(newSortType);
  };

  // 处理题目排序变更
  const handleQuestionSortChange = (newSortType: QuestionSortType) => {
    setQuestionSortType(newSortType);
  };

  // 获取排序图标
  const getSortIcon = () => {
    switch (sortType) {
      case SortType.NameAsc:
        return <FaSortAlphaDown className="ml-1" />;
      case SortType.NameDesc:
        return <FaSortAlphaUp className="ml-1" />;
      case SortType.DateAsc:
        return <FaClock className="ml-1" />;
      case SortType.DateDesc:
        return <FaClock className="ml-1" />;
      default:
        return <FaSort className="ml-1" />;
    }
  };

  // 获取题目排序图标
  const getQuestionSortIcon = (sortType: QuestionSortType) => {
    switch (sortType) {
      case QuestionSortType.ContentAsc:
      case QuestionSortType.TypeAsc:
        return <FaSortAlphaDown className="ml-1" />;
      case QuestionSortType.ContentDesc:
      case QuestionSortType.TypeDesc:
        return <FaSortAlphaUp className="ml-1" />;
      case QuestionSortType.DateAsc:
        return <FaClock className="ml-1" />;
      case QuestionSortType.DateDesc:
        return <FaClock className="ml-1" />;
      default:
        return <FaSort className="ml-1" />;
    }
  };

  // 处理查找重复题目
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
    setSelectedDuplicates(new Set());
    setIsDuplicateModalOpen(true);
  };

  // 处理选择重复题目
  const handleSelectDuplicate = (questionId: string) => {
    const newSelectedDuplicates = new Set(selectedDuplicates);
    if (newSelectedDuplicates.has(questionId)) {
      newSelectedDuplicates.delete(questionId);
    } else {
      newSelectedDuplicates.add(questionId);
    }
    setSelectedDuplicates(newSelectedDuplicates);
  };

  // 处理批量删除选中的重复题目
  const handleDeleteSelectedDuplicates = () => {
    if (!selectedBank || selectedDuplicates.size === 0) return;
    setDeleteConfirmType("duplicates");
    setIsDeleteConfirmModalOpen(true);
  };

  // 确认删除操作
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
      case "duplicates":
        selectedDuplicates.forEach((questionId) => {
          deleteQuestionFromBank(selectedBank.id, questionId);
        });
        toast.success(
          t("bankManage.alerts.duplicatesDeleted", {
            count: selectedDuplicates.size,
          })
        );
        setIsDuplicateModalOpen(false);
        setSelectedDuplicates(new Set());
        break;
    }

    setIsDeleteConfirmModalOpen(false);
  };

  // 获取删除确认对话框的内容
  const getDeleteConfirmContent = () => {
    switch (deleteConfirmType) {
      case "bank":
        return {
          title: t("bankManage.deleteConfirm.bankTitle"),
          description: t("bankManage.deleteConfirm.bankMessage", {
            name: selectedBank?.name,
          }),
        };
      case "question":
        if (!questionToDelete) return { title: "", description: "" };
        return {
          title: t("bankManage.deleteConfirm.questionTitle"),
          description: t("bankManage.deleteConfirm.questionMessage", {
            content:
              questionToDelete.content.substring(0, 50) +
              (questionToDelete.content.length > 50 ? "..." : ""),
          }),
        };
      case "duplicates":
        return {
          title: t("bankManage.deleteConfirm.duplicatesTitle"),
          description: t("bankManage.deleteConfirm.duplicatesMessage", {
            count: selectedDuplicates.size,
          }),
        };
      default:
        return { title: "", description: "" };
    }
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
      <Card className="mb-8 shadow-lg">
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
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-grow w-full sm:w-auto">
              <Select
                onValueChange={handleSelectBank}
                value={selectedBankId || ""}
              >
                <SelectTrigger className="w-full min-w-[250px] text-base py-2.5">
                  <SelectValue
                    placeholder={t("bankManage.selectPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {sortedBanks.length === 0 && (
                    <SelectItem value="__disabled__" disabled>
                      {t("bankManage.noBanks")}
                    </SelectItem>
                  )}
                  {sortedBanks.map((bank) => (
                    <SelectItem
                      key={bank.id}
                      value={bank.id}
                      className="text-base py-2"
                    >
                      {bank.name} ({bank.questions ? bank.questions.length : 0}
                      题)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleCreateNewBank}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
            >
              <FaPlusCircle className="mr-2" /> {t("bankManage.createNew")}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 self-center mr-1">
              排序方式:
            </span>
            <Button
              variant={sortType === SortType.NameAsc ? "default" : "outline"}
              size="sm"
              onClick={() =>
                handleSortChange(
                  sortType === SortType.NameAsc
                    ? SortType.NameDesc
                    : SortType.NameAsc
                )
              }
              className="text-xs"
            >
              {t("bankManage.sortByName")}{" "}
              {sortType === SortType.NameAsc ? (
                <FaSortAlphaDown className="ml-1" />
              ) : sortType === SortType.NameDesc ? (
                <FaSortAlphaUp className="ml-1" />
              ) : (
                <FaSort className="ml-1" />
              )}
            </Button>

            <Button
              variant={
                sortType === SortType.DateAsc || sortType === SortType.DateDesc
                  ? "default"
                  : "outline"
              }
              size="sm"
              onClick={() =>
                handleSortChange(
                  sortType === SortType.DateDesc
                    ? SortType.DateAsc
                    : SortType.DateDesc
                )
              }
              className="text-xs"
            >
              {t("bankManage.sortByDate")}{" "}
              {sortType === SortType.DateAsc ? (
                <FaClock className="ml-1" />
              ) : sortType === SortType.DateDesc ? (
                <FaClock className="ml-1" />
              ) : (
                <FaSort className="ml-1" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedBank && (
        <Card className="animate-fade-in shadow-lg">
          <CardHeader className="border-b dark:border-gray-700 pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl md:text-2xl text-blue-700 dark:text-blue-400">
                {t("bankManage.bankLabel")}: {selectedBank.name}
              </CardTitle>
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
          </CardHeader>
          <CardContent className="pt-6">
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditBankName(e.target.value)
                    }
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
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setEditBankDescription(e.target.value)
                    }
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
                  {selectedBank.description || t("bankManage.noDescription")}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    {t("bankManage.questionCount")}:
                  </span>{" "}
                  {selectedBank.questions ? selectedBank.questions.length : 0}{" "}
                  {t("bankManage.questionUnit")}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    创建时间:
                  </span>{" "}
                  {selectedBank.createdAt
                    ? new Date(selectedBank.createdAt).toLocaleString()
                    : "未知"}
                </p>
              </div>
            )}

            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                题目列表 ({filteredQuestions.length}/
                {selectedBank.questions ? selectedBank.questions.length : 0}题)
              </h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleFindDuplicates}
                  className="flex items-center"
                >
                  <FaClone className="mr-2" /> {t("bankManage.findDuplicates")}
                </Button>
                <Button
                  size="sm"
                  className="bg-green-500 hover:bg-green-600"
                  onClick={handleOpenAddQuestionModal}
                >
                  <FaPlusCircle className="mr-2" />{" "}
                  {t("bankManage.addQuestion")}
                </Button>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex flex-col sm:flex-row gap-2 mb-2">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400 dark:text-gray-500" />
                  </div>
                  <Input
                    type="text"
                    placeholder={t("bankManage.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                {searchQuery && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="ml-2"
                    onClick={() => setSearchQuery("")}
                  >
                    <span className="sr-only">{t("bankManage.clear")}</span>×
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-sm text-gray-500 dark:text-gray-400 self-center mr-1">
                  {t("bankManage.questionSort")}:
                </span>
                <Button
                  variant={
                    questionSortType === QuestionSortType.ContentAsc ||
                    questionSortType === QuestionSortType.ContentDesc
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    handleQuestionSortChange(
                      questionSortType === QuestionSortType.ContentAsc
                        ? QuestionSortType.ContentDesc
                        : QuestionSortType.ContentAsc
                    )
                  }
                  className="text-xs"
                >
                  {t("bankManage.sortByContent")}{" "}
                  {questionSortType === QuestionSortType.ContentAsc ? (
                    <FaSortAlphaDown className="ml-1" />
                  ) : questionSortType === QuestionSortType.ContentDesc ? (
                    <FaSortAlphaUp className="ml-1" />
                  ) : (
                    <FaSort className="ml-1" />
                  )}
                </Button>

                <Button
                  variant={
                    questionSortType === QuestionSortType.TypeAsc ||
                    questionSortType === QuestionSortType.TypeDesc
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    handleQuestionSortChange(
                      questionSortType === QuestionSortType.TypeAsc
                        ? QuestionSortType.TypeDesc
                        : QuestionSortType.TypeAsc
                    )
                  }
                  className="text-xs"
                >
                  {t("bankManage.sortByType")}{" "}
                  {questionSortType === QuestionSortType.TypeAsc ? (
                    <FaSortAlphaDown className="ml-1" />
                  ) : questionSortType === QuestionSortType.TypeDesc ? (
                    <FaSortAlphaUp className="ml-1" />
                  ) : (
                    <FaSort className="ml-1" />
                  )}
                </Button>

                <Button
                  variant={
                    questionSortType === QuestionSortType.DateAsc ||
                    questionSortType === QuestionSortType.DateDesc
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    handleQuestionSortChange(
                      questionSortType === QuestionSortType.DateDesc
                        ? QuestionSortType.DateAsc
                        : QuestionSortType.DateDesc
                    )
                  }
                  className="text-xs"
                >
                  {t("bankManage.sortByAddTime")}{" "}
                  {questionSortType === QuestionSortType.DateAsc ? (
                    <FaClock className="ml-1" />
                  ) : questionSortType === QuestionSortType.DateDesc ? (
                    <FaClock className="ml-1" />
                  ) : (
                    <FaSort className="ml-1" />
                  )}
                </Button>
              </div>
            </div>

            {filteredQuestions.length > 0 ? (
              <ul className="space-y-3">
                {filteredQuestions.map((question, index) => (
                  <li
                    key={question.id}
                    className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md shadow-sm flex justify-between items-center"
                  >
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                        {index + 1}.
                      </span>
                      <span
                        className="font-medium text-gray-800 dark:text-gray-100 truncate max-w-xs sm:max-w-sm md:max-w-md"
                        title={question.content}
                      >
                        {question.content}
                      </span>
                      <span className="ml-3 px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200">
                        {QUESTION_TYPE_NAMES[question.type] || question.type}
                      </span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleOpenEditQuestionModal(question)}
                      >
                        <FaEdit className="h-3.5 w-3.5" />
                        <span className="sr-only">
                          {t("bankManage.editQuestion")}
                        </span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          handleDeleteQuestion(question.id, question.content)
                        }
                      >
                        <FaTrash className="h-3.5 w-3.5" />
                        <span className="sr-only">
                          {t("bankManage.deleteQuestion")}
                        </span>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-6">
                {searchQuery
                  ? t("bankManage.noQuestionsFound")
                  : t("bankManage.noQuestionsYet")}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedBankId && questionBanks && questionBanks.length > 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {t("bankManage.selectBankPrompt")}
          </p>
        </div>
      )}
      {!selectedBankId && questionBanks && questionBanks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {t("bankManage.noBanksPrompt")}
          </p>
        </div>
      )}

      {/* 没有找到重复题目的模态框 */}
      <Dialog
        open={isNoDuplicatesModalOpen}
        onOpenChange={setIsNoDuplicatesModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("bankManage.duplicates.noResults")}</DialogTitle>
            <DialogDescription>
              {!selectedBank ||
              !selectedBank.questions ||
              selectedBank.questions.length < 2
                ? t("bankManage.duplicates.notEnough")
                : t("bankManage.duplicates.noDuplicates")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
            <Button onClick={() => setIsNoDuplicatesModalOpen(false)}>
              {t("bankManage.duplicates.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog
        open={isDeleteConfirmModalOpen}
        onOpenChange={setIsDeleteConfirmModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{getDeleteConfirmContent().title}</DialogTitle>
            <DialogDescription>
              {getDeleteConfirmContent().description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
            <div className="flex gap-2 w-full justify-end">
              <Button
                variant="outline"
                onClick={() => setIsDeleteConfirmModalOpen(false)}
              >
                {t("bankManage.cancel")}
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                {t("bankManage.delete")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重复题目模态框 */}
      <Dialog
        open={isDuplicateModalOpen}
        onOpenChange={setIsDuplicateModalOpen}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("bankManage.duplicates.title")}</DialogTitle>
            <DialogDescription>
              {t("bankManage.duplicates.description")}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 mt-4 max-h-[60vh] overflow-auto pr-4">
            <div className="pb-4">
              {Array.from(duplicateGroups.entries()).map(
                ([normalizedContent, questions], groupIndex) => (
                  <div
                    key={normalizedContent}
                    className="mb-6 pb-6 border-b dark:border-gray-700"
                  >
                    <div className="mb-2 font-medium">
                      <Badge variant="outline" className="mr-2">
                        {t("bankManage.duplicates.group", {
                          index: groupIndex + 1,
                        })}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {t("bankManage.duplicates.normalized", {
                          text: normalizedContent,
                        })}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {questions.map((question) => (
                        <li
                          key={question.id}
                          className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md flex items-start gap-3"
                        >
                          <Checkbox
                            id={`question-${question.id}`}
                            checked={selectedDuplicates.has(question.id)}
                            onCheckedChange={() =>
                              handleSelectDuplicate(question.id)
                            }
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={`question-${question.id}`}
                              className="block mb-1 text-sm font-medium cursor-pointer"
                            >
                              {question.content}
                            </label>
                            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                              <span>
                                {t("bankManage.duplicates.type", {
                                  type: QUESTION_TYPE_NAMES[question.type],
                                })}
                              </span>
                              {question.createdAt && (
                                <span>
                                  {t("bankManage.duplicates.addedAt", {
                                    time: new Date(
                                      question.createdAt
                                    ).toLocaleString(),
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {t("bankManage.duplicates.selected", {
                count: selectedDuplicates.size,
              })}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDuplicateModalOpen(false)}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteSelectedDuplicates}
                disabled={selectedDuplicates.size === 0}
              >
                {t("bankManage.duplicates.deleteSelected")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

// 主页面组件，优化为静态导出方式
export default function ManageBanksPage() {
  const { theme } = useThemeStore();

  // 使用安全的方式在客户端获取URL参数
  const [initialTempBankId, setInitialTempBankId] = useState<string | null>(
    null
  );

  useEffect(() => {
    // 在这里添加关键的静态路径标记，帮助构建系统识别路径
    // 通过注释或隐藏元素确保这些路径被识别 - 这是静态导出的关键
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
        // 优先检查bankId参数（从题库列表直接进入）
        const bankId = urlParams.get("bankId");
        if (bankId) {
          setInitialTempBankId(bankId);
          // 清理URL，避免重复加载
          const url = new URL(window.location.href);
          url.searchParams.delete("bankId");
          window.history.replaceState({}, "", url.toString());
          return;
        }

        // 兼容原有的tempBankId参数
        const tempBankId = urlParams.get("tempBankId");
        if (tempBankId) {
          setInitialTempBankId(tempBankId);
          // 清理URL，避免重复加载
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
      {/* 添加隐藏的链接元素，帮助静态导出系统识别路由 */}
      <div style={{ display: "none" }}>
        <a href="/quiz/banks/manage">管理题库</a>
        <a href="/quiz/banks/manage/">管理题库带斜杠</a>
        <a href="/quiz/banks/manage/index.html">管理题库HTML</a>
      </div>
      <ManageBanksPageContent initialTempBankId={initialTempBankId} />
    </Suspense>
  );
}
