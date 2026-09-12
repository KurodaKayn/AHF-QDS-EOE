import { useState, useEffect } from "react";
import type { QuestionBank } from "@/model/quiz";

interface UseBankDetailsCardProps {
  bank: QuestionBank;
  onUpdate: (name: string, description: string) => Promise<void>;
}

export function useBankDetailsCard({ bank, onUpdate }: UseBankDetailsCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(bank.name);
  const [editDescription, setEditDescription] = useState(bank.description || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditName(bank.name);
    setEditDescription(bank.description || "");
    setIsEditing(false);
  }, [bank.id, bank.name, bank.description]);

  const handleSave = async () => {
    if (!editName.trim()) return;
    setIsSaving(true);
    try {
      await onUpdate(editName.trim(), editDescription.trim());
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isEditing,
    setIsEditing,
    editName,
    setEditName,
    editDescription,
    setEditDescription,
    isSaving,
    handleSave,
  };
}
