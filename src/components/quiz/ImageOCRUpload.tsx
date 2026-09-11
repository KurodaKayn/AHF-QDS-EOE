"use client";

import { FaImage, FaSpinner } from "react-icons/fa";
import { MdUpload } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { useImageOCRUpload } from "./useImageOCRUpload";

interface ImageOCRUploadProps {
  onTextExtracted: (text: string) => void;
  onError?: (error: string) => void;
}

export function ImageOCRUpload({ onTextExtracted, onError }: ImageOCRUploadProps) {
  const { t } = useTranslation();
  const {
    isProcessing,
    progress,
    fileInputRef,
    handleFileSelect,
    handlePaste,
    handleDrop,
    handleDragOver,
  } = useImageOCRUpload({ onTextExtracted, onError });

  return (
    <div className="mb-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-2">
            <FaSpinner className="animate-spin text-blue-600 dark:text-blue-400 text-2xl mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("convert.ocrUpload.processing")} {progress}%
            </p>
            <div className="w-full max-w-xs mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-2">
            <div className="flex items-center gap-2 mb-2">
              <FaImage className="text-gray-400 text-xl" />
              <MdUpload className="text-gray-400 text-xl" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {t("convert.ocrUpload.dragDrop")}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {t("convert.ocrUpload.supportHint")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
