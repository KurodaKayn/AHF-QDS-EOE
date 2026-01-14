"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";

interface CreateBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => void;
}

/**
 * Modal dialog component for creating a new question bank.
 */
export default function CreateBankModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateBankModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Reset data every time it opens
      setName("");
      setDescription("");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!name.trim()) {
      setError(t("practice.createModal.errorNameRequired"));
      return;
    }

    setError("");
    onSubmit(name.trim(), description.trim());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {t("practice.createModal.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <div>
            <label
              htmlFor="bankName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t("practice.createModal.nameLabel")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <Input
              id="bankName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder={t("practice.createModal.namePlaceholder")}
              className="w-full"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div>
            <label
              htmlFor="bankDescription"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t("practice.createModal.descLabel")}
            </label>
            <Textarea
              id="bankDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("practice.createModal.descPlaceholder")}
              rows={3}
              className="w-full"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="mr-2">
            {t("practice.createModal.cancel")}
          </Button>
          <Button onClick={handleSubmit}>
            {t("practice.createModal.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
