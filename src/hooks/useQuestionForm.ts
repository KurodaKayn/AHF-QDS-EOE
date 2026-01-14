import { useState, useEffect, useCallback } from "react";
import { Question, QuestionType, QuestionOption } from "@/types/quiz";
import { v4 as uuidv4 } from "uuid";
import { useTranslation } from "react-i18next";

const defaultQuestionOptions: QuestionOption[] = [
  { id: uuidv4(), content: "" },
  { id: uuidv4(), content: "" },
  { id: uuidv4(), content: "" },
  { id: uuidv4(), content: "" },
];

interface UseQuestionFormProps {
  questionToEdit?: Question | null;
  isOpen: boolean;
}

/**
 * Question Form Logic Hook
 * Manages all state and validation logic for question editing/creation
 */
export function useQuestionForm({
  questionToEdit,
  isOpen,
}: UseQuestionFormProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [type, setType] = useState<QuestionType>(QuestionType.SingleChoice);
  const [options, setOptions] = useState<QuestionOption[]>(
    defaultQuestionOptions
  );
  const [answer, setAnswer] = useState<string | string[]>("");
  const [explanation, setExplanation] = useState("");

  const isEditMode = !!questionToEdit;

  /**
   * Initialize or reset form
   */
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && questionToEdit) {
        setContent(questionToEdit.content);
        setType(questionToEdit.type);
        setOptions(
          questionToEdit.options && questionToEdit.options.length > 0
            ? questionToEdit.options.map((opt) => ({ ...opt }))
            : defaultQuestionOptions.map((opt) => ({ ...opt }))
        );
        setAnswer(questionToEdit.answer);
        setExplanation(questionToEdit.explanation || "");
      } else {
        resetForm();
      }
    }
  }, [isOpen, isEditMode, questionToEdit]);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setContent("");
    setType(QuestionType.SingleChoice);
    setOptions(defaultQuestionOptions.map((opt) => ({ ...opt, content: "" })));
    setAnswer("");
    setExplanation("");
  }, []);

  /**
   * Handle question type change
   */
  const handleTypeChange = useCallback(
    (newType: QuestionType) => {
      setType(newType);

      if (newType === QuestionType.TrueFalse) {
        setOptions([
          { id: "true", content: t("questionForm.optionTrue") },
          { id: "false", content: t("questionForm.optionFalse") },
        ]);
        setAnswer("");
      } else if (
        newType === QuestionType.ShortAnswer ||
        newType === QuestionType.FillInBlank
      ) {
        setOptions([]);
        setAnswer("");
      } else {
        // Single choice, Multiple choice
        setOptions((prevOptions) => {
          if (
            prevOptions.length < 2 ||
            prevOptions.some((o) => o.id === "true" || o.id === "false")
          ) {
            return defaultQuestionOptions.map((opt) => ({
              ...opt,
              content: "",
            }));
          }
          return prevOptions;
        });
        setAnswer(newType === QuestionType.MultipleChoice ? [] : "");
      }
    },
    [t]
  );

  /**
   * Handle option content change
   */
  const handleOptionContentChange = useCallback(
    (optionId: string, value: string) => {
      setOptions((prevOptions) =>
        prevOptions.map((opt) =>
          opt.id === optionId ? { ...opt, content: value } : opt
        )
      );
    },
    []
  );

  /**
   * Add option
   */
  const handleAddOption = useCallback(() => {
    setOptions((prevOptions) => [
      ...prevOptions,
      { id: uuidv4(), content: "" },
    ]);
  }, []);

  /**
   * Remove option
   */
  const handleRemoveOption = useCallback(
    (optionId: string) => {
      setOptions((prevOptions) =>
        prevOptions.filter((opt) => opt.id !== optionId)
      );

      // Sync cleanup answer
      if (type === QuestionType.SingleChoice && answer === optionId) {
        setAnswer("");
      }
      if (
        type === QuestionType.MultipleChoice &&
        Array.isArray(answer) &&
        answer.includes(optionId)
      ) {
        setAnswer((prevAns) =>
          (prevAns as string[]).filter((id) => id !== optionId)
        );
      }
    },
    [type, answer]
  );

  /**
   * Handle answer selection (single/multiple choice)
   */
  const handleAnswerSelection = useCallback(
    (optionId: string) => {
      if (
        type === QuestionType.SingleChoice ||
        type === QuestionType.TrueFalse
      ) {
        setAnswer(optionId);
      } else if (type === QuestionType.MultipleChoice) {
        setAnswer((prevAns) => {
          const currentAnswers = Array.isArray(prevAns) ? prevAns : [];
          if (currentAnswers.includes(optionId)) {
            return currentAnswers.filter((id) => id !== optionId);
          }
          return [...currentAnswers, optionId];
        });
      }
    },
    [type]
  );

  /**
   * Validate form
   */
  const validate = useCallback((): { valid: boolean; error?: string } => {
    if (!content.trim()) {
      return {
        valid: false,
        error: t("questionForm.validation.contentRequired"),
      };
    }

    if (
      (type === QuestionType.SingleChoice ||
        type === QuestionType.MultipleChoice) &&
      options.some((opt) => !opt.content.trim())
    ) {
      return {
        valid: false,
        error: t("questionForm.validation.optionsRequired"),
      };
    }

    if (
      (type === QuestionType.SingleChoice || type === QuestionType.TrueFalse) &&
      !answer
    ) {
      return {
        valid: false,
        error: t("questionForm.validation.singleAnswerRequired"),
      };
    }

    if (
      type === QuestionType.MultipleChoice &&
      (!Array.isArray(answer) || answer.length === 0)
    ) {
      return {
        valid: false,
        error: t("questionForm.validation.multipleAnswerRequired"),
      };
    }

    if (
      (type === QuestionType.ShortAnswer ||
        type === QuestionType.FillInBlank) &&
      !(answer as string).trim()
    ) {
      return {
        valid: false,
        error: t("questionForm.validation.textAnswerRequired"),
      };
    }

    return { valid: true };
  }, [content, type, options, answer, t]);

  /**
   * Build question data
   */
  const buildQuestionData = useCallback((): Omit<Question, "id"> => {
    return {
      content: content.trim(),
      type,
      options:
        type === QuestionType.ShortAnswer || type === QuestionType.FillInBlank
          ? []
          : options.map((o) => ({ id: o.id, content: o.content.trim() })),
      answer,
      explanation: explanation.trim(),
      createdAt: questionToEdit?.createdAt || Date.now(),
      updatedAt: Date.now(),
      tags: questionToEdit?.tags || [],
    };
  }, [content, type, options, answer, explanation, questionToEdit]);

  return {
    // State
    content,
    type,
    options,
    answer,
    explanation,
    isEditMode,

    // Setters
    setContent,
    setAnswer,
    setExplanation,

    // Handlers
    handleTypeChange,
    handleOptionContentChange,
    handleAddOption,
    handleRemoveOption,
    handleAnswerSelection,

    // Utility methods
    validate,
    buildQuestionData,
    resetForm,
  };
}
