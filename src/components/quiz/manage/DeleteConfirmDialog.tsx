import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export type DeleteType = "bank" | "question" | "duplicates";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  deleteType: DeleteType;
  bankName?: string;
  questionContent?: string;
  duplicateCount?: number;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({
  isOpen,
  deleteType,
  bankName,
  questionContent,
  duplicateCount,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const { t } = useTranslation();

  const getContent = () => {
    switch (deleteType) {
      case "bank":
        return {
          title: t("bankManage.deleteConfirm.bankTitle"),
          description: t("bankManage.deleteConfirm.bankMessage", {
            name: bankName,
          }),
        };
      case "question":
        if (!questionContent) return { title: "", description: "" };
        return {
          title: t("bankManage.deleteConfirm.questionTitle"),
          description: t("bankManage.deleteConfirm.questionMessage", {
            content:
              questionContent.substring(0, 50) +
              (questionContent.length > 50 ? "..." : ""),
          }),
        };
      case "duplicates":
        return {
          title: t("bankManage.deleteConfirm.duplicatesTitle"),
          description: t("bankManage.deleteConfirm.duplicatesMessage", {
            count: duplicateCount || 0,
          }),
        };
      default:
        return { title: "", description: "" };
    }
  };

  const content = getContent();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription>{content.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end">
          <div className="flex gap-2 w-full justify-end">
            <Button variant="outline" onClick={onClose}>
              {t("bankManage.cancel")}
            </Button>
            <Button variant="destructive" onClick={onConfirm}>
              {t("bankManage.delete")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
