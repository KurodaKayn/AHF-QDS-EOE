import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Question } from "@/types/quiz";
import { QUESTION_TYPE_NAMES } from "@/constants/quiz";
import { useTranslation } from "react-i18next";

interface DuplicateQuestionsModalProps {
  isOpen: boolean;
  duplicateGroups: Map<string, Question[]>;
  onClose: () => void;
  onDeleteSelected: (selectedIds: Set<string>) => void;
}

export function DuplicateQuestionsModal({
  isOpen,
  duplicateGroups,
  onClose,
  onDeleteSelected,
}: DuplicateQuestionsModalProps) {
  const { t } = useTranslation();
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<string>>(
    new Set()
  );

  const handleSelectDuplicate = (questionId: string) => {
    const newSelected = new Set(selectedDuplicates);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedDuplicates(newSelected);
  };

  const handleDelete = () => {
    onDeleteSelected(selectedDuplicates);
    setSelectedDuplicates(new Set());
  };

  const handleClose = () => {
    setSelectedDuplicates(new Set());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("bankManage.duplicates.title")}</DialogTitle>
          <DialogDescription>
            {t("bankManage.duplicates.description")}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 mt-4 max-h-[60vh] overflow-auto pr-4">
          <div className="pb-4">
            {Array.from(duplicateGroups.entries()).map(
              ([normalizedContent, questions], groupIndex) => (
                <div
                  key={normalizedContent}
                  className="mb-6 pb-6 border-b dark:border-gray-700"
                >
                  <div className="mb-2 font-medium">
                    <Badge variant="outline" className="mr-2">
                      {t("bankManage.duplicates.group", {
                        index: groupIndex + 1,
                      })}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {t("bankManage.duplicates.normalized", {
                        text: normalizedContent,
                      })}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {questions.map((question) => (
                      <li
                        key={question.id}
                        className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md flex items-start gap-3"
                      >
                        <Checkbox
                          id={`question-${question.id}`}
                          checked={selectedDuplicates.has(question.id)}
                          onCheckedChange={() =>
                            handleSelectDuplicate(question.id)
                          }
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={`question-${question.id}`}
                            className="block mb-1 text-sm font-medium cursor-pointer"
                          >
                            {question.content}
                          </label>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                            <span>
                              {t("bankManage.duplicates.type", {
                                type: QUESTION_TYPE_NAMES[question.type],
                              })}
                            </span>
                            {question.createdAt && (
                              <span>
                                {t("bankManage.duplicates.addedAt", {
                                  time: new Date(
                                    question.createdAt
                                  ).toLocaleString(),
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {t("bankManage.duplicates.selected", {
              count: selectedDuplicates.size,
            })}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={selectedDuplicates.size === 0}
            >
              {t("bankManage.duplicates.deleteSelected")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
