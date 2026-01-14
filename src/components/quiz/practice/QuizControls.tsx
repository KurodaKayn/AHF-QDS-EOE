"use client";

import { Button } from "@/components/ui/button";
import { FaArrowLeft, FaArrowRight, FaLightbulb } from "react-icons/fa";
import { useTranslation } from "react-i18next";

interface QuizControlsProps {
  showAnswer: boolean;
  isCurrentCorrect: boolean | null;
  canPressNext: boolean;
  isLastQuestion: boolean;
  currentQuestionIndex: number;
  onShowAnswer: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function QuizControls({
  showAnswer,
  isCurrentCorrect,
  canPressNext,
  isLastQuestion,
  currentQuestionIndex,
  onShowAnswer,
  onNext,
  onPrevious,
}: QuizControlsProps) {
  const { t } = useTranslation();

  const nextButtonText = isLastQuestion
    ? t("practice.nav.finish")
    : t("practice.nav.next");

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 p-4 sm:p-6 border-t dark:border-gray-700">
      <Button
        variant="outline"
        onClick={onShowAnswer}
        disabled={showAnswer}
        className="w-full sm:w-auto text-sm md:text-base disabled:opacity-60"
      >
        <FaLightbulb className="mr-2" />
        {showAnswer
          ? isCurrentCorrect
            ? t("practice.status.correct")
            : t("practice.status.incorrect")
          : t("practice.showAnswer")}
      </Button>

      <div className="flex gap-3 w-full sm:w-auto">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={currentQuestionIndex === 0}
          className="flex-1 sm:flex-initial text-sm md:text-base disabled:opacity-60"
        >
          <FaArrowLeft className="mr-1 sm:mr-2" /> {t("practice.nav.previous")}
        </Button>
        <Button
          onClick={onNext}
          disabled={!canPressNext}
          className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm md:text-base disabled:opacity-60"
        >
          {nextButtonText} <FaArrowRight className="ml-1 sm:ml-2" />
        </Button>
      </div>
    </div>
  );
}
