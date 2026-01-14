"use client";

import { Button } from "@/components/ui/button";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { Question } from "@/types/quiz";
import { useTranslation } from "react-i18next";

interface TrueFalseOptionsProps {
  question: Question;
  userAnswer: string | string[] | undefined;
  showAnswer: boolean;
  onAnswerSelect: (optionId: string) => void;
}

export function TrueFalseOptions({
  question,
  userAnswer,
  showAnswer,
  onAnswerSelect,
}: TrueFalseOptionsProps) {
  const { t } = useTranslation();
  const options = [
    { id: "true", content: t("aiExplanation.correct") },
    { id: "false", content: t("aiExplanation.incorrect") },
  ];

  const currentSelection = (userAnswer as string) || "";

  return options.map((option) => {
    const isSelected = currentSelection === option.id;
    let buttonClass =
      "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700";
    let indicator = null;

    if (showAnswer) {
      const isCorrectAnswer =
        (question.answer as string).toLowerCase() === option.id;
      if (isCorrectAnswer) {
        buttonClass =
          "bg-green-100 dark:bg-green-800/50 border-green-500 dark:border-green-600 text-green-700 dark:text-green-300";
        indicator = (
          <FaCheckCircle className="text-green-500 dark:text-green-400" />
        );
      } else if (isSelected) {
        buttonClass =
          "bg-red-100 dark:bg-red-800/50 border-red-500 dark:border-red-600 text-red-700 dark:text-red-300";
        indicator = (
          <FaTimesCircle className="text-red-500 dark:text-red-400" />
        );
      }
    } else if (isSelected) {
      buttonClass =
        "bg-blue-100 dark:bg-blue-700/50 border-blue-500 dark:border-blue-600 text-blue-700 dark:text-blue-300";
    }

    return (
      <Button
        key={option.id}
        variant="outline"
        className={`w-full justify-start p-4 text-left h-auto mb-3 rounded-lg shadow-sm transition-all duration-150 ease-in-out text-base md:text-lg ${buttonClass}`}
        onClick={() => onAnswerSelect(option.id)}
        disabled={showAnswer}
      >
        <span className="flex-1 break-words whitespace-pre-wrap">
          {option.content}
        </span>
        {indicator && <span className="ml-3 text-xl">{indicator}</span>}
      </Button>
    );
  });
}
