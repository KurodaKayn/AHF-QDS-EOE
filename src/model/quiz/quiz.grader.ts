import type { Question } from "./quiz.contract";
import { QuestionType } from "./quiz.contract";
import { shuffleArray } from "@/lib/array";

/**
 * Grader and practice session business rules.
 */
export class PracticeHandlers {
  /**
   * Checks if the user answer is correct
   */
  static checkIsCorrect(question: Question, userAnswer: string | string[] | undefined): boolean {
    if (userAnswer === undefined || userAnswer === null) return false;

    const correctAnswer = question.answer;

    switch (question.type) {
      case QuestionType.SingleChoice:
      case QuestionType.TrueFalse:
        if (typeof userAnswer !== "string" || typeof correctAnswer !== "string") return false;
        return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

      case QuestionType.MultipleChoice: {
        if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswer)) {
          return false;
        }
        if (userAnswer.length !== correctAnswer.length) {
          return false;
        }
        const userSet = new Set(userAnswer.map((a) => String(a).trim().toLowerCase()));
        const correctSet = new Set(correctAnswer.map((a) => String(a).trim().toLowerCase()));
        if (userSet.size !== correctSet.size) return false;
        for (const item of correctSet) {
          if (!userSet.has(item)) return false;
        }
        return true;
      }

      case QuestionType.FillInBlank: {
        if (typeof correctAnswer !== "string") return false;
        let rawUserAns = "";
        if (typeof userAnswer === "string") {
          rawUserAns = userAnswer;
        } else if (Array.isArray(userAnswer)) {
          rawUserAns = userAnswer.join(";");
        }
        const userAns = rawUserAns.trim().toLowerCase();
        if (!userAns) return false;

        let acceptableAnswers: string[];
        if (correctAnswer.includes(";")) {
          acceptableAnswers = correctAnswer
            .split(/(?<!;);(?!;)/)
            .map((ans) => ans.replace(/;;/g, ";").trim().toLowerCase());
        } else {
          acceptableAnswers = [correctAnswer.trim().toLowerCase()];
        }
        return acceptableAnswers.some((ans) => ans === userAns);
      }

      case QuestionType.ShortAnswer:
        if (typeof correctAnswer !== "string" || typeof userAnswer !== "string") return false;
        return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

      default:
        if (typeof correctAnswer === "string" && typeof userAnswer === "string") {
          return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
        }
        return false;
    }
  }

  /**
   * Shuffles an array (pure utility delegation)
   */
  static shuffleArray<T>(array: T[]): T[] {
    return shuffleArray([...array]);
  }

  /**
   * Prepares practice questions (shuffles order and options)
   */
  static preparePracticeQuestions(
    questions: Question[],
    options: {
      shuffleQuestionOrder?: boolean;
      shuffleOptions?: boolean;
    },
  ): Question[] {
    let questionsToSet = [...questions];

    if (options.shuffleQuestionOrder) {
      questionsToSet = this.shuffleArray(questionsToSet);
    }

    if (options.shuffleOptions) {
      questionsToSet = questionsToSet.map((q) => {
        if (q.options && q.type !== QuestionType.TrueFalse && q.options.length > 1) {
          const shuffledOptions = this.shuffleArray([...q.options]);
          return {
            ...q,
            options: shuffledOptions,
          };
        }
        return q;
      });
    }

    return questionsToSet;
  }

  /**
   * Calculates practice statistics
   */
  static calculateStats(
    practiceQuestions: Question[],
    userAnswers: Record<string, string | string[]>,
  ) {
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    practiceQuestions.forEach((question) => {
      const userAnswer = userAnswers[question.id];
      if (!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0)) {
        unansweredCount++;
      } else if (this.checkIsCorrect(question, userAnswer)) {
        correctCount++;
      } else {
        wrongCount++;
      }
    });

    const totalQuestions = practiceQuestions.length;
    const answeredCount = totalQuestions - unansweredCount;
    const accuracy = answeredCount > 0 ? (correctCount / answeredCount) * 100 : 0;

    return {
      totalQuestions,
      correctCount,
      wrongCount,
      unansweredCount,
      answeredCount,
      accuracy,
    };
  }
}

export const checkIsCorrect = PracticeHandlers.checkIsCorrect;
export const preparePracticeQuestions = PracticeHandlers.preparePracticeQuestions;
export const calculateStats = PracticeHandlers.calculateStats;
