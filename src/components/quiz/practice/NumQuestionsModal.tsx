"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";

interface NumQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (numQuestions: number) => void;
  maxQuestions: number;
}

/**
 * Modal for selecting the number of questions to practice.
 */
export function NumQuestionsModal({
  isOpen,
  onClose,
  onSubmit,
  maxQuestions,
}: NumQuestionsModalProps) {
  const { t } = useTranslation();
  const [numQuestions, setNumQuestions] = useState(Math.min(20, maxQuestions));

  const handleSubmit = () => {
    onSubmit(numQuestions);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("practice.numModal.title")}</DialogTitle>
          <DialogDescription>
            {t("practice.numModal.errorExceed", { total: maxQuestions })}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("practice.numModal.label")}
          </label>
          <input
            type="number"
            min={1}
            max={maxQuestions}
            value={numQuestions}
            onChange={(e) =>
              setNumQuestions(
                Math.max(
                  1,
                  Math.min(maxQuestions, parseInt(e.target.value) || 1)
                )
              )
            }
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t("practice.numModal.instruction")}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("practice.numModal.cancel")}
          </Button>
          <Button onClick={handleSubmit}>{t("practice.numModal.start")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
