"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Question, QuestionType } from "@/types/quiz";
import { QUESTION_TYPE_NAMES } from "@/constants/quiz";
import { useQuestionForm } from "@/hooks/useQuestionForm";
import { toast } from "sonner";
import { FaTrash, FaPlus } from "react-icons/fa";
import { useTranslation } from "react-i18next";

interface QuestionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankId: string;
  questionToEdit?: Question | null;
  onSubmitSuccess?: () => void;
  onSave: (
    bankId: string,
    questionData: Omit<Question, "id">,
    questionId?: string
  ) => void;
}

/**
 * Unified Question Form Modal Component
 * Supports creating and editing questions with separated UI and business logic
 */
export default function QuestionFormModal({
  isOpen,
  onClose,
  bankId,
  questionToEdit,
  onSubmitSuccess,
  onSave,
}: QuestionFormModalProps) {
  const { t } = useTranslation();
  const {
    content,
    type,
    options,
    answer,
    explanation,
    isEditMode,
    setContent,
    setAnswer,
    setExplanation,
    handleTypeChange,
    handleOptionContentChange,
    handleAddOption,
    handleRemoveOption,
    handleAnswerSelection,
    validate,
    buildQuestionData,
  } = useQuestionForm({ questionToEdit, isOpen });

  const handleSubmit = () => {
    const validation = validate();
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    const questionData = buildQuestionData();
    onSave(bankId, questionData, questionToEdit?.id);

    if (onSubmitSuccess) onSubmitSuccess();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? t("questionForm.titleEdit")
              : t("questionForm.titleAdd")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3 overflow-y-auto flex-grow pr-2">
          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("questionForm.questionType")}
            </label>
            <Select
              value={type}
              onValueChange={(value) => handleTypeChange(value as QuestionType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(QUESTION_TYPE_NAMES).map(([value, name]) => (
                  <SelectItem key={value} value={value}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Question Content */}
          <div>
            <label
              htmlFor="questionContent"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t("questionForm.questionContent")}
            </label>
            <Textarea
              id="questionContent"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("questionForm.questionContentPlaceholder")}
              rows={4}
              className="text-base"
            />
          </div>

          {/* Options for Single/Multiple/True-False */}
          {(type === QuestionType.SingleChoice ||
            type === QuestionType.MultipleChoice ||
            type === QuestionType.TrueFalse) && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("questionForm.options")}
                </label>
                {(type === QuestionType.SingleChoice ||
                  type === QuestionType.MultipleChoice) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddOption}
                    className="text-xs"
                  >
                    <FaPlus className="mr-1" /> {t("questionForm.addOption")}
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[20px]">
                      {type !== QuestionType.TrueFalse
                        ? String.fromCharCode(65 + index) + "."
                        : ""}
                    </span>
                    <Input
                      value={option.content}
                      onChange={(e) =>
                        handleOptionContentChange(option.id, e.target.value)
                      }
                      placeholder={t("questionForm.optionPlaceholder", {
                        letter: String.fromCharCode(65 + index),
                      })}
                      disabled={type === QuestionType.TrueFalse}
                      className="text-base flex-grow"
                    />
                    {(type === QuestionType.SingleChoice ||
                      type === QuestionType.MultipleChoice) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveOption(option.id)}
                        disabled={
                          options.length <=
                          (type === QuestionType.SingleChoice ? 2 : 1)
                        }
                        className="h-8 w-8 text-red-500 hover:text-red-700 disabled:text-gray-400"
                      >
                        <FaTrash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Answer Selection/Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("questionForm.correctAnswer")}
            </label>
            {(type === QuestionType.SingleChoice ||
              type === QuestionType.TrueFalse) && (
              <Select
                value={answer as string}
                onValueChange={handleAnswerSelection}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t("questionForm.selectAnswerPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option, index) => (
                    <SelectItem key={option.id} value={option.id}>
                      {type !== QuestionType.TrueFalse
                        ? String.fromCharCode(65 + index) + ". "
                        : ""}
                      {option.content}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {type === QuestionType.MultipleChoice && (
              <div className="space-y-2 p-2 border dark:border-gray-600 rounded-md">
                {options.map((option, index) => (
                  <label
                    key={option.id}
                    className="flex items-center space-x-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={
                        Array.isArray(answer) && answer.includes(option.id)
                      }
                      onChange={() => handleAnswerSelection(option.id)}
                      className="form-checkbox h-4 w-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-500 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800"
                    />
                    <span>
                      {String.fromCharCode(65 + index)}. {option.content}
                    </span>
                  </label>
                ))}
              </div>
            )}
            {(type === QuestionType.ShortAnswer ||
              type === QuestionType.FillInBlank) && (
              <>
                <Textarea
                  value={answer as string}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={
                    type === QuestionType.FillInBlank
                      ? t("questionForm.fillInBlankPlaceholder")
                      : t("questionForm.shortAnswerPlaceholder")
                  }
                  rows={3}
                  className="text-base"
                />
                {type === QuestionType.FillInBlank && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t("questionForm.fillInBlankHint")}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Explanation */}
          <div>
            <label
              htmlFor="questionExplanation"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t("questionForm.explanation")}
            </label>
            <Textarea
              id="questionExplanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder={t("questionForm.explanationPlaceholder")}
              rows={3}
              className="text-base"
            />
          </div>
        </div>

        <DialogFooter className="pt-3 border-t dark:border-gray-700">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("questionForm.cancel")}
            </Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit}>
            {isEditMode
              ? t("questionForm.saveChanges")
              : t("questionForm.addQuestion")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
