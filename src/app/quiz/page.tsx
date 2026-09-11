"use client";

import { FaPlay, FaBook, FaPlus } from "react-icons/fa";
import type { QuestionBank } from "@/types/quiz";
import { Button } from "@/components/ui/button";
import { useQuizDashboard } from "./useQuizDashboard";

/**
 * Quiz Dashboard Page
 * Focuses purely on UI organization; state, timer, and navigation are in useQuizDashboard.
 */
export default function QuizPage() {
  const {
    t,
    questionBanks,
    hasUnfinishedSession,
    unfinishedBank,
    practiceSession,
    handleContinuePractice,
    handleStartPractice,
    handleManageBank,
    formatUpdatedAt,
  } = useQuizDashboard();

  const renderQuizListItem = (bank: QuestionBank) => (
    <div
      key={bank.id}
      className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1"
    >
      <div className="flex flex-col h-full">
        <div className="flex-grow">
          <div className="flex justify-between items-start mb-3">
            <h2
              className="text-xl font-semibold text-gray-800 dark:text-white truncate pr-2"
              title={bank.name}
            >
              {bank.name}
            </h2>
          </div>
          <p
            className="text-gray-600 dark:text-gray-400 text-sm mb-1 line-clamp-2"
            title={bank.description}
          >
            {bank.description || t("home.noDescription")}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
            {t("home.questionCount", { count: bank.questions.length })} ·{" "}
            {t("home.updatedAt", {
              time: formatUpdatedAt(bank.updatedAt),
            })}
          </p>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleStartPractice(bank.id)}
            disabled={bank.questions.length === 0}
            className={`flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium transition-colors
                        ${
                          bank.questions.length === 0
                            ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                            : "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
                        }`}
          >
            <FaPlay className="mr-2" /> {t("home.startPractice")}
          </button>
          <button
            type="button"
            onClick={() => handleManageBank(bank.id)}
            className="flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
          >
            <FaBook className="mr-2" /> {t("home.manageBank")}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Continue practice prompt */}
      {hasUnfinishedSession && unfinishedBank && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 text-white p-2 rounded-full">
              <FaPlay className="text-sm" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {t("home.continueSession")}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {unfinishedBank.name} · {practiceSession.currentQuestionIndex + 1}/
                {practiceSession.practiceQuestions.length}
              </p>
            </div>
          </div>
          <Button
            onClick={handleContinuePractice}
            className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            {t("home.continue")}
          </Button>
        </div>
      )}

      <header className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white">{t("home.pageTitle")}</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">{t("home.pageSubtitle")}</p>
      </header>

      {questionBanks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-500 dark:text-gray-400 mb-6">{t("home.noBanks")}</p>
          <Button onClick={() => handleManageBank()} className="bg-green-600 hover:bg-green-700">
            <FaPlus className="mr-2" /> {t("home.createNewBank")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {questionBanks.map(renderQuizListItem)}
        </div>
      )}
    </div>
  );
}
