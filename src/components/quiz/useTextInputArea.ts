import { useRef, useState } from "react";
import Tesseract from "tesseract.js";
import { useTranslation } from "react-i18next";

interface UseTextInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onOCRError?: (error: string) => void;
  showOCR?: boolean;
}

export function useTextInputArea({
  value,
  onChange,
  onOCRError,
  showOCR = true,
}: UseTextInputAreaProps) {
  const { t } = useTranslation();
  const [isProcessingPaste, setIsProcessingPaste] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleOCRText = (text: string) => {
    if (value.trim()) {
      onChange(value + "\n\n" + text);
    } else {
      onChange(text);
    }
  };

  const processImageFromClipboard = async (file: File) => {
    setIsProcessingPaste(true);
    try {
      const result = await Tesseract.recognize(file, "chi_sim+eng");
      const extractedText = result.data.text.trim();
      if (extractedText) {
        handleOCRText(extractedText);
      } else {
        onOCRError?.(t("convert.input.ocrFailed"));
      }
    } catch (error: any) {
      onOCRError?.(error.message || t("convert.input.ocrErrorGeneric"));
    } finally {
      setIsProcessingPaste(false);
    }
  };

  const handleTextareaPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!showOCR) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await processImageFromClipboard(file);
        }
        return;
      }
    }
  };

  return {
    isProcessingPaste,
    textareaRef,
    handleOCRText,
    handleTextareaPaste,
  };
}
