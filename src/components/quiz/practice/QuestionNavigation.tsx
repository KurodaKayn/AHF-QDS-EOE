"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaHome,
  FaRedo,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";

interface QuestionNavigationProps {
  currentIndex: number;
  totalQuestions: number;
  isLastQuestion: boolean;
  canPressNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onComplete: () => void;
  onJumpTo: (index: number) => void;
  onReturnToBank: () => void;
  onReload: () => void;
}

/**
 * Question navigation component
 * Provides previous, next, jump, and return to bank functionality
 */
export function QuestionNavigation({
  currentIndex,
  totalQuestions,
  isLastQuestion,
  canPressNext,
  onPrevious,
  onNext,
  onComplete,
  onJumpTo,
  onReturnToBank,
  onReload,
}: QuestionNavigationProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits
    if (/^\d*$/.test(value)) {
      setInputValue(value);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const num = parseInt(inputValue, 10);
      if (num >= 1 && num <= totalQuestions) {
        onJumpTo(num - 1); // convert to 0-indexed
      }
      setIsEditing(false);
      setInputValue("");
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setInputValue("");
    }
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    setInputValue("");
  };

  const handleCurrentClick = () => {
    setIsEditing(true);
    setInputValue(String(currentIndex + 1));
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={onReload}
            variant="outline"
            className="flex items-center gap-2"
            title={t("practice.nav.reload")}
          >
            <FaRedo />
          </Button>

          <Button
            onClick={onPrevious}
            disabled={currentIndex === 0}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FaArrowLeft />
            {t("practice.nav.previous")}
          </Button>
        </div>

        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
          {isEditing ? (
            <Input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              onBlur={handleInputBlur}
              className="w-12 h-7 text-center text-sm p-1"
              autoFocus
            />
          ) : (
            <button
              onClick={handleCurrentClick}
              className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer font-medium"
              title={t("practice.nav.jumpTooltip")}
            >
              {currentIndex + 1}
            </button>
          )}
          <span>/ {totalQuestions}</span>
        </div>

        <div className="flex items-center gap-2">
          {isLastQuestion ? (
            <Button
              onClick={onComplete}
              disabled={!canPressNext}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <FaCheck />
              {t("practice.nav.finish")}
            </Button>
          ) : (
            <Button
              onClick={onNext}
              disabled={!canPressNext}
              className="flex items-center gap-2"
            >
              {t("practice.nav.next")}
              <FaArrowRight />
            </Button>
          )}

          <Button
            onClick={onReturnToBank}
            variant="outline"
            className="flex items-center gap-2"
            title={t("practice.nav.returnToBank")}
          >
            <FaHome />
          </Button>
        </div>
      </div>
    </div>
  );
}
