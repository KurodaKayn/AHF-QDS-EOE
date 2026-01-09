"use client";

import { useState } from "react";
import { FaPlus, FaTrash, FaSave } from "react-icons/fa";
import { Question, QuestionType, QuestionOption } from "@/types/quiz";
import { QUESTION_TYPE_NAMES } from "@/constants/quiz";

interface QuestionFormModalProps {
  isOpen: boolean;
  isEdit: boolean;
  question: Question | null;
  onClose: () => void;
  onSave: (questionData: Omit<Question, "id">) => void;
}

export function QuestionFormModal({
  isOpen,
  isEdit,
  question,
  onClose,
  onSave,
}: QuestionFormModalProps) {
  const [questionContent, setQuestionContent] = useState(
    question?.content || ""
  );
  const [questionType, setQuestionType] = useState<QuestionType>(
    question?.type || QuestionType.SingleChoice
  );
  const [questionOptions, setQuestionOptions] = useState<QuestionOption[]>(
    question?.options
      ? [...question.options]
      : [
          { id: crypto.randomUUID(), content: "" },
          { id: crypto.randomUUID(), content: "" },
          { id: crypto.randomUUID(), content: "" },
          { id: crypto.randomUUID(), content: "" },
        ]
  );
  const [questionAnswer, setQuestionAnswer] = useState<string | string[]>(
    question?.answer || ""
  );
  const [questionExplanation, setQuestionExplanation] = useState(
    question?.explanation || ""
  );

  const handleAddOption = () => {
    setQuestionOptions([
      ...questionOptions,
      { id: crypto.randomUUID(), content: "" },
    ]);
  };

  const handleRemoveOption = (id: string) => {
    setQuestionOptions(questionOptions.filter((opt) => opt.id !== id));

    if (questionType === QuestionType.SingleChoice && questionAnswer === id) {
      setQuestionAnswer("");
    } else if (
      questionType === QuestionType.MultipleChoice &&
      Array.isArray(questionAnswer)
    ) {
      setQuestionAnswer(questionAnswer.filter((ans) => ans !== id));
    }
  };

  const handleOptionChange = (id: string, content: string) => {
    setQuestionOptions(
      questionOptions.map((opt) => (opt.id === id ? { ...opt, content } : opt))
    );
  };

  const handleAnswerChange = (id: string) => {
    if (questionType === QuestionType.SingleChoice) {
      setQuestionAnswer(id);
    } else if (questionType === QuestionType.MultipleChoice) {
      const currentAnswers = Array.isArray(questionAnswer)
        ? questionAnswer
        : [];
      if (currentAnswers.includes(id)) {
        setQuestionAnswer(currentAnswers.filter((a) => a !== id));
      } else {
        setQuestionAnswer([...currentAnswers, id]);
      }
    }
  };

  const handleTypeChange = (type: QuestionType) => {
    setQuestionType(type);

    if (type === QuestionType.SingleChoice) {
      setQuestionAnswer("");
    } else if (type === QuestionType.MultipleChoice) {
      setQuestionAnswer([]);
    } else if (type === QuestionType.TrueFalse) {
      setQuestionOptions([
        { id: crypto.randomUUID(), content: "正确" },
        { id: crypto.randomUUID(), content: "错误" },
      ]);
      setQuestionAnswer("");
    } else if (type === QuestionType.ShortAnswer) {
      setQuestionOptions([]);
      setQuestionAnswer("");
    } else if (type === QuestionType.FillInBlank) {
      setQuestionOptions([]);
      setQuestionAnswer("");
    }
  };

  const handleSaveQuestion = () => {
    if (!questionContent.trim()) {
      alert("题目内容不能为空");
      return;
    }

    if (
      (questionType === QuestionType.SingleChoice ||
        questionType === QuestionType.MultipleChoice) &&
      questionOptions.length < 2
    ) {
      alert("选择题至少需要两个选项");
      return;
    }

    if (
      (questionType === QuestionType.SingleChoice && !questionAnswer) ||
      (questionType === QuestionType.MultipleChoice &&
        (!Array.isArray(questionAnswer) || questionAnswer.length === 0))
    ) {
      alert("请选择正确答案");
      return;
    }

    const questionData: Omit<Question, "id"> = {
      content: questionContent,
      type: questionType,
      options: questionType === QuestionType.ShortAnswer ? [] : questionOptions,
      answer: questionAnswer,
      explanation: questionExplanation,
      tags: question?.tags || [],
      createdAt: question?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSave(questionData);
  };

  const handleFillInBlankAnswerChange = (index: number, value: string) => {
    const currentAnswers = Array.isArray(questionAnswer)
      ? questionAnswer
      : questionAnswer
      ? [questionAnswer as string]
      : [];
    const newAnswers = [...currentAnswers];
    newAnswers[index] = value;
    setQuestionAnswer(newAnswers.length > 0 ? newAnswers : "");
  };

  const addFillInBlankAnswer = () => {
    const currentAnswers = Array.isArray(questionAnswer)
      ? questionAnswer
      : questionAnswer
      ? [questionAnswer as string]
      : [];
    setQuestionAnswer([...currentAnswers, ""]);
  };

  const removeFillInBlankAnswer = (index: number) => {
    const newAnswers = [...questionAnswer] as string[];
    newAnswers.splice(index, 1);
    setQuestionAnswer(newAnswers.length > 0 ? newAnswers : "");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto max-h-screen">
      <div
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
          {isEdit ? "编辑题目" : "添加新题目"}
        </h3>

        <div className="space-y-5">
          {/* 题目类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              题目类型
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(QUESTION_TYPE_NAMES).map(([typeValue, name]) => (
                <button
                  key={typeValue}
                  onClick={() => handleTypeChange(typeValue as QuestionType)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    typeValue === questionType
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* 题目内容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              题目内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={questionContent}
              onChange={(e) => setQuestionContent(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="请输入题目内容..."
            />
          </div>

          {/* 选择题选项 */}
          {(questionType === QuestionType.SingleChoice ||
            questionType === QuestionType.MultipleChoice ||
            questionType === QuestionType.TrueFalse) && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  选项 <span className="text-red-500">*</span>
                </label>
                {(questionType === QuestionType.SingleChoice ||
                  questionType === QuestionType.MultipleChoice) && (
                  <button
                    onClick={handleAddOption}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm flex items-center"
                    type="button"
                  >
                    <FaPlus size={12} className="mr-1" /> 添加选项
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {questionOptions.map((option, index) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <div className="flex-none">
                      <input
                        type={
                          questionType === QuestionType.SingleChoice
                            ? "radio"
                            : "checkbox"
                        }
                        checked={
                          questionType === QuestionType.SingleChoice
                            ? questionAnswer === option.id
                            : Array.isArray(questionAnswer) &&
                              questionAnswer.includes(option.id)
                        }
                        onChange={() => handleAnswerChange(option.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                      />
                    </div>
                    <div className="grow">
                      <input
                        type="text"
                        value={option.content}
                        onChange={(e) =>
                          handleOptionChange(option.id, e.target.value)
                        }
                        placeholder={`选项 ${String.fromCharCode(65 + index)}`}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    {questionType !== QuestionType.TrueFalse && (
                      <button
                        onClick={() => handleRemoveOption(option.id)}
                        disabled={questionOptions.length <= 2}
                        className={`p-1 rounded-full ${
                          questionOptions.length <= 2
                            ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                            : "text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        }`}
                        title={
                          questionOptions.length <= 2
                            ? "至少需要两个选项"
                            : "删除此选项"
                        }
                      >
                        <FaTrash size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 简答题答案 */}
          {questionType === QuestionType.ShortAnswer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                参考答案 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={questionAnswer as string}
                onChange={(e) => setQuestionAnswer(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="请输入参考答案..."
              />
            </div>
          )}

          {/* 填空题答案 */}
          {questionType === QuestionType.FillInBlank && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  填空答案 <span className="text-red-500">*</span>
                </label>
                <button
                  onClick={addFillInBlankAnswer}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm flex items-center"
                  type="button"
                >
                  <FaPlus size={12} className="mr-1" /> 添加答案
                </button>
              </div>

              <div className="space-y-2">
                {Array.isArray(questionAnswer) ? (
                  questionAnswer.map((answer, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="grow">
                        <input
                          type="text"
                          value={answer}
                          onChange={(e) =>
                            handleFillInBlankAnswerChange(index, e.target.value)
                          }
                          placeholder={`答案 ${index + 1}`}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <button
                        onClick={() => removeFillInBlankAnswer(index)}
                        className="p-1 rounded-full text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        title="删除此答案"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <input
                    type="text"
                    value={questionAnswer as string}
                    onChange={(e) => setQuestionAnswer(e.target.value)}
                    placeholder="填空答案"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                提示:
                可添加多个可接受的答案。当有多个空需要填写时，请按顺序添加答案。
              </p>
            </div>
          )}

          {/* 题目解析 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              解析 (可选)
            </label>
            <textarea
              value={questionExplanation}
              onChange={(e) => setQuestionExplanation(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="请输入题目解析..."
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            取消
          </button>
          <button
            onClick={handleSaveQuestion}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md flex items-center"
          >
            <FaSave className="mr-2" /> {isEdit ? "保存更改" : "添加题目"}
          </button>
        </div>
      </div>
    </div>
  );
}
