import { useState, useCallback } from "react";
import { callAIStream } from "@/constants/ai";
import { EXPLANATION_PROMPT } from "@/constants/ai";
import { QUESTION_TYPE_NAMES } from "@/constants/quiz";
import { QuestionType } from "@/types/quiz";
import { WrongQuestionDisplay } from "@/components/quiz/WrongQuestionItem";
import { useTranslation } from "react-i18next";

interface AiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

/**
 * AI Explanation Generation Hook
 * Manages the generation, state tracking, and error handling of question explanations
 */
export function useAiExplanation() {
  const { t } = useTranslation();
  const [generatingExplanations, setGeneratingExplanations] = useState<
    Set<string>
  >(new Set());
  const [aiError, setAiError] = useState<string | null>(null);
  const [currentExplanations, setCurrentExplanations] = useState<
    Record<string, string>
  >({});
  const [completedExplanations, setCompletedExplanations] = useState<
    Record<string, string>
  >({});

  /**
   * Build question information prompt for AI
   */
  const buildQuestionPrompt = useCallback(
    (questionInfo: WrongQuestionDisplay): string => {
      let problemInfo = `### ${t("aiExplanation.questionInfo")}\n- **${t(
        "aiExplanation.questionType"
      )}**: ${QUESTION_TYPE_NAMES[questionInfo.type]}\n`;

      if (questionInfo.options && questionInfo.options.length > 0) {
        problemInfo += `- **${t("aiExplanation.options")}**:\n`;
        questionInfo.options.forEach((opt, idx) => {
          problemInfo += `  - ${String.fromCharCode(65 + idx)}. ${
            opt.content
          }\n`;
        });
      }

      const correctAnswerText = Array.isArray(questionInfo.answer)
        ? questionInfo.answer
            .map(
              (ansId) =>
                questionInfo.options?.find((opt) => opt.id === ansId)
                  ?.content || ansId
            )
            .join(", ")
        : questionInfo.type === QuestionType.TrueFalse
        ? questionInfo.answer === "true"
          ? t("aiExplanation.correct")
          : t("aiExplanation.incorrect")
        : questionInfo.answer;

      problemInfo += `- **${t(
        "aiExplanation.correctAnswer"
      )}**: ${correctAnswerText}\n`;

      const userAnswerText = Array.isArray(questionInfo.userAnswer)
        ? questionInfo.userAnswer
            .map(
              (ansId) =>
                questionInfo.options?.find((opt) => opt.id === ansId)
                  ?.content || ansId
            )
            .join(", ")
        : questionInfo.type === QuestionType.TrueFalse
        ? questionInfo.userAnswer === "true"
          ? t("aiExplanation.correct")
          : t("aiExplanation.incorrect")
        : questionInfo.userAnswer;

      problemInfo += `- **${t(
        "aiExplanation.userAnswer"
      )}**: ${userAnswerText}\n`;

      return `${problemInfo}\n${questionInfo.content}`;
    },
    [t]
  );

  /**
   * Generate explanation for a single question
   */
  const generateExplanation = useCallback(
    async (
      questionInfo: WrongQuestionDisplay,
      aiConfig: AiConfig,
      onComplete?: (questionId: string, explanation: string) => void
    ) => {
      const questionId = questionInfo.id;

      if (
        generatingExplanations.has(questionId) ||
        completedExplanations[questionId]
      ) {
        return;
      }

      setGeneratingExplanations((prev) => new Set(prev).add(questionId));
      setCurrentExplanations((prev) => ({ ...prev, [questionId]: "" }));

      try {
        const prompt = buildQuestionPrompt(questionInfo);
        const messages = [
          { role: "system", content: EXPLANATION_PROMPT },
          { role: "user", content: prompt },
        ];

        let fullExplanation = "";
        await callAIStream(
          aiConfig.baseUrl,
          aiConfig.apiKey,
          aiConfig.model,
          messages,
          (chunk) => {
            setCurrentExplanations((prev) => {
              fullExplanation = (prev[questionId] || "") + chunk;
              return { ...prev, [questionId]: fullExplanation };
            });
          }
        );

        const finalExplanation = fullExplanation.trim();
        setCompletedExplanations((prev) => ({
          ...prev,
          [questionId]: finalExplanation,
        }));

        if (onComplete) {
          onComplete(questionId, finalExplanation);
        }
      } catch (error) {
        setAiError(
          t("aiExplanation.generationFailed", {
            content: questionInfo.content.substring(0, 20),
          })
        );
        setCurrentExplanations((prev) => ({
          ...prev,
          [questionId]: t("aiExplanation.failedRetry"),
        }));
      } finally {
        setGeneratingExplanations((prev) => {
          const newSet = new Set(prev);
          newSet.delete(questionId);
          return newSet;
        });
      }
    },
    [generatingExplanations, completedExplanations, buildQuestionPrompt, t]
  );

  /**
   * Generate explanations in batch
   */
  const generateBatchExplanations = useCallback(
    async (
      questions: WrongQuestionDisplay[],
      aiConfig: AiConfig,
      onComplete?: (questionId: string, explanation: string) => void
    ) => {
      for (const question of questions) {
        await generateExplanation(question, aiConfig, onComplete);
      }
    },
    [generateExplanation]
  );

  /**
   * Clean up completed explanations when question list changes
   */
  const cleanupExplanations = useCallback((validQuestionIds: Set<string>) => {
    setCompletedExplanations((prev) => {
      const newExplanations = { ...prev };
      let changed = false;

      Object.keys(newExplanations).forEach((questionId) => {
        if (!validQuestionIds.has(questionId)) {
          delete newExplanations[questionId];
          changed = true;
        }
      });

      return changed ? newExplanations : prev;
    });
  }, []);

  return {
    generatingExplanations,
    aiError,
    currentExplanations,
    completedExplanations,
    setAiError,
    generateExplanation,
    generateBatchExplanations,
    cleanupExplanations,
  };
}
