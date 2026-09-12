import { renderHook, act } from "@testing-library/react";
import { useQuestionForm } from "./useQuestionForm";
import { QuestionType } from "@/model/quiz";

describe("useQuestionForm", () => {
  it("initializes with default single choice values when open", () => {
    const { result } = renderHook(() => useQuestionForm({ isOpen: true }));

    expect(result.current.type).toBe(QuestionType.SingleChoice);
    expect(result.current.content).toBe("");
    expect(result.current.options.length).toBe(4);
    expect(result.current.answer).toBe("");
  });

  it("validates required fields using questionSchema", () => {
    const { result } = renderHook(() => useQuestionForm({ isOpen: true }));

    // Empty content fails
    const initialValidation = result.current.validate();
    expect(initialValidation.valid).toBe(false);

    // Fill content, but options empty
    act(() => {
      result.current.setContent("Question 1");
    });
    const optionValidation = result.current.validate();
    expect(optionValidation.valid).toBe(false);

    // Fill options, but answer empty
    act(() => {
      result.current.options.forEach((opt, idx) => {
        result.current.handleOptionContentChange(opt.id, `Option ${idx + 1}`);
      });
    });
    const answerValidation = result.current.validate();
    expect(answerValidation.valid).toBe(false);

    // Select answer
    act(() => {
      result.current.handleAnswerSelection(result.current.options[0].id);
    });
    const completeValidation = result.current.validate();
    expect(completeValidation.valid).toBe(true);
  });

  it("handles switching question types", () => {
    const { result } = renderHook(() => useQuestionForm({ isOpen: true }));

    // Switch to TrueFalse
    act(() => {
      result.current.handleTypeChange(QuestionType.TrueFalse);
    });
    expect(result.current.type).toBe(QuestionType.TrueFalse);
    expect(result.current.options.length).toBe(2);
    expect(result.current.options[0].id).toBe("true");
    expect(result.current.options[1].id).toBe("false");

    // Switch to ShortAnswer
    act(() => {
      result.current.handleTypeChange(QuestionType.ShortAnswer);
    });
    expect(result.current.type).toBe(QuestionType.ShortAnswer);
    expect(result.current.options.length).toBe(0);

    // Switch to MultipleChoice
    act(() => {
      result.current.handleTypeChange(QuestionType.MultipleChoice);
    });
    expect(result.current.type).toBe(QuestionType.MultipleChoice);
    expect(Array.isArray(result.current.answer)).toBe(true);
  });
});
