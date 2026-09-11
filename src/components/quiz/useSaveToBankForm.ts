import { useState } from "react";

interface SaveConfig {
  mode: "new" | "existing";
  bankId?: string;
  newBankName?: string;
  newBankDescription?: string;
}

interface UseSaveToBankFormProps {
  disabled?: boolean;
  onSave: (config: SaveConfig) => void | Promise<void>;
}

export function useSaveToBankForm({ disabled = false, onSave }: UseSaveToBankFormProps) {
  const [saveMode, setSaveMode] = useState<"new" | "existing">("new");
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [newBankName, setNewBankName] = useState("");
  const [newBankDescription, setNewBankDescription] = useState("");

  const handleSave = async () => {
    if (saveMode === "new") {
      if (!newBankName.trim()) return;
      await onSave({ mode: "new", newBankName, newBankDescription });
      setNewBankName("");
      setNewBankDescription("");
    } else {
      if (!selectedBankId) return;
      await onSave({ mode: "existing", bankId: selectedBankId });
    }
  };

  const isDisabled =
    disabled ||
    (saveMode === "new" && !newBankName.trim()) ||
    (saveMode === "existing" && !selectedBankId);

  return {
    saveMode,
    setSaveMode,
    selectedBankId,
    setSelectedBankId,
    newBankName,
    setNewBankName,
    newBankDescription,
    setNewBankDescription,
    handleSave,
    isDisabled,
  };
}
