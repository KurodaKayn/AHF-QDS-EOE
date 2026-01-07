"use client";

import { useRef, useState } from "react";
import { IoDocumentText } from "react-icons/io5";
import { FaKeyboard, FaSpinner } from "react-icons/fa";
import { ImageOCRUpload } from "./ImageOCRUpload";
import Tesseract from "tesseract.js";

interface TextInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onLoadExample?: () => void;
  onOCRError?: (error: string) => void;
  placeholder?: string;
  showOCR?: boolean;
}

export function TextInputArea({
  value,
  onChange,
  onLoadExample,
  onOCRError,
  placeholder = "在此粘贴题目文本或图片。支持单选题、多选题、判断题、简答题的自动识别。",
  showOCR = true,
}: TextInputAreaProps) {
  const [isProcessingPaste, setIsProcessingPaste] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleOCRText = (text: string) => {
    // 如果已有内容，追加；否则直接设置
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
        onOCRError?.("未能从图片中识别出文字，请确保图片清晰");
      }
    } catch (error: any) {
      console.error("OCR Error:", error);
      onOCRError?.(error.message || "图片识别失败");
    } finally {
      setIsProcessingPaste(false);
    }
  };

  const handleTextareaPaste = async (
    e: React.ClipboardEvent<HTMLTextAreaElement>
  ) => {
    if (!showOCR) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    // 检查是否有图片
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        e.preventDefault(); // 阻止默认的粘贴行为
        const file = items[i].getAsFile();
        if (file) {
          await processImageFromClipboard(file);
        }
        return;
      }
    }
    // 如果不是图片，让浏览器处理默认的文本粘贴
  };

  return (
    <div className="mb-6">
      <label
        htmlFor="textToConvert"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        输入需要转换的题目文本:
      </label>

      {showOCR && (
        <ImageOCRUpload onTextExtracted={handleOCRText} onError={onOCRError} />
      )}

      <div className="relative">
        <textarea
          ref={textareaRef}
          id="textToConvert"
          rows={10}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handleTextareaPaste}
          disabled={isProcessingPaste}
          className={`w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm ${
            isProcessingPaste ? "opacity-50 cursor-not-allowed" : ""
          }`}
          placeholder={placeholder}
        />
        {isProcessingPaste && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 rounded-md">
            <div className="flex flex-col items-center gap-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
              <FaSpinner className="animate-spin text-blue-600 dark:text-blue-400 text-2xl" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                正在识别图片文字...
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-between items-center">
        {onLoadExample && (
          <button
            onClick={onLoadExample}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm flex items-center"
          >
            <IoDocumentText className="mr-1" /> 加载示例
          </button>
        )}
        <div className="text-gray-500 dark:text-gray-400 text-sm">
          <FaKeyboard className="inline mr-1" /> 支持粘贴文本或图片
        </div>
      </div>
    </div>
  );
}
