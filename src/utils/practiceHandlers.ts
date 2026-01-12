import { Question, QuestionType } from "@/types/quiz";

/**
 * 刷题业务逻辑处理器
 * 将所有业务逻辑从组件中抽离
 */
export class PracticeHandlers {
  /**
   * 检查答案是否正确
   */
  static checkIsCorrect(
    question: Question,
    userAnswer: string | string[] | undefined
  ): boolean {
    if (!userAnswer) return false;

    const correctAnswer = question.answer;

    switch (question.type) {
      case QuestionType.SingleChoice:
      case QuestionType.TrueFalse:
        return userAnswer === correctAnswer;

      case QuestionType.MultipleChoice:
        if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswer)) {
          return false;
        }
        if (userAnswer.length !== correctAnswer.length) {
          return false;
        }
        const sortedUserAnswer = [...userAnswer].sort();
        const sortedCorrectAnswer = [...correctAnswer].sort();
        return sortedUserAnswer.every(
          (ans, index) => ans === sortedCorrectAnswer[index]
        );

      case QuestionType.FillInBlank:
        if (typeof correctAnswer !== "string") return false;
        const correctAnswers = correctAnswer
          .split(";")
          .map((a) => a.trim().toLowerCase());
        const userAnswerStr =
          typeof userAnswer === "string" ? userAnswer : userAnswer.join(";");
        const userAnswerLower = userAnswerStr.trim().toLowerCase();
        return correctAnswers.some((ans) => ans === userAnswerLower);

      case QuestionType.ShortAnswer:
        if (typeof correctAnswer !== "string" || typeof userAnswer !== "string")
          return false;
        return (
          userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
        );

      default:
        return false;
    }
  }

  /**
   * 打乱数组
   */
  static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * 准备练习题目（打乱顺序和选项）
   */
  static preparePracticeQuestions(
    questions: Question[],
    options: {
      shuffleQuestionOrder?: boolean;
      shuffleOptions?: boolean;
    }
  ): Question[] {
    let questionsToSet = [...questions];

    if (options.shuffleQuestionOrder) {
      questionsToSet = this.shuffleArray(questionsToSet);
    }

    if (options.shuffleOptions) {
      questionsToSet = questionsToSet.map((q) => {
        if (
          q.options &&
          q.type !== QuestionType.TrueFalse &&
          q.options.length > 1
        ) {
          const shuffledOptions = this.shuffleArray([...q.options]);
          return { ...q, options: shuffledOptions };
        }
        return q;
      });
    }

    return questionsToSet;
  }

  /**
   * 计算练习统计信息
   */
  static calculateStats(
    practiceQuestions: Question[],
    userAnswers: Record<string, string | string[]>
  ) {
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    practiceQuestions.forEach((question) => {
      const userAnswer = userAnswers[question.id];
      if (
        !userAnswer ||
        (Array.isArray(userAnswer) && userAnswer.length === 0)
      ) {
        unansweredCount++;
      } else if (this.checkIsCorrect(question, userAnswer)) {
        correctCount++;
      } else {
        wrongCount++;
      }
    });

    const totalQuestions = practiceQuestions.length;
    const answeredCount = totalQuestions - unansweredCount;
    const accuracy =
      answeredCount > 0 ? (correctCount / answeredCount) * 100 : 0;

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
