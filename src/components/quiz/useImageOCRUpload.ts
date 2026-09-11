import { useState, useRef } from "react";
import Tesseract from "tesseract.js";
import { useTranslation } from "react-i18next";

interface UseImageOCRUploadProps {
  onTextExtracted: (text: string) => void;
  onError?: (error: string) => void;
}

export function useImageOCRUpload({ onTextExtracted, onError }: UseImageOCRUploadProps) {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);

    try {
      const result = await Tesseract.recognize(file, "chi_sim+eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const extractedText = result.data.text.trim();
      if (extractedText) {
        onTextExtracted(extractedText);
      } else {
        onError?.(t("convert.input.ocrFailed"));
      }
    } catch (error: any) {
      onError?.(error.message || t("convert.input.ocrErrorGeneric"));
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        onError?.(t("convert.ocrUpload.errorType"));
        return;
      }
      processImage(file);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await processImage(file);
        }
        break;
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      await processImage(file);
    } else {
      onError?.(t("convert.ocrUpload.errorDrag"));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return {
    isProcessing,
    progress,
    fileInputRef,
    handleFileSelect,
    handlePaste,
    handleDrop,
    handleDragOver,
  };
}
