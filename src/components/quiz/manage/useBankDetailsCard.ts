import { useState, useEffect } from "react";
import type { QuestionBank } from "@/types/quiz";

interface UseBankDetailsCardProps {
  bank: QuestionBank;
  onUpdate: (name: string, description: string) => void;
}

export function useBankDetailsCard({ bank, onUpdate }: UseBankDetailsCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(bank.name);
  const [editDescription, setEditDescription] = useState(bank.description || "");

  useEffect(() => {
    setEditName(bank.name);
    setEditDescription(bank.description || "");
    setIsEditing(false);
  }, [bank]);

  const handleSave = () => {
    if (!editName.trim()) return;
    onUpdate(editName.trim(), editDescription.trim());
    setIsEditing(false);
  };

  return {
    isEditing,
    setIsEditing,
    editName,
    setEditName,
    editDescription,
    setEditDescription,
    handleSave,
  };
}
