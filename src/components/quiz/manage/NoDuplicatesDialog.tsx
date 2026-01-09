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

interface NoDuplicatesDialogProps {
  isOpen: boolean;
  hasEnoughQuestions: boolean;
  onClose: () => void;
}

export function NoDuplicatesDialog({
  isOpen,
  hasEnoughQuestions,
  onClose,
}: NoDuplicatesDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("bankManage.duplicates.noResults")}</DialogTitle>
          <DialogDescription>
            {hasEnoughQuestions
              ? t("bankManage.duplicates.noDuplicates")
              : t("bankManage.duplicates.notEnough")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end">
          <Button onClick={onClose}>
            {t("bankManage.duplicates.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
