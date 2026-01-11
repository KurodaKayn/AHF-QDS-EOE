"use client";

import {
  FaFileImport,
  FaFileExport,
  FaCheck,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useImportExport } from "@/hooks/useImportExport";
import { useTranslation } from "react-i18next";

export default function ImportExportPage() {
  const { t } = useTranslation();

  const {
    // State
    selectedBankId,
    importFormat,
    exportFormat,
    importName,
    importSuccess,
    exportSuccess,
    importResult,
    fileInputRef,
    questionBanks,

    // Actions
    setSelectedBankId,
    setImportFormat,
    setExportFormat,
    setImportName,
    handleImport,
    handleExport,
  } = useImportExport();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-8">
        {t("importExport.title")}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Import Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <FaFileImport
              className="text-blue-600 dark:text-blue-400 mr-2"
              size={20}
            />
            <h2 className="text-lg font-semibold dark:text-white">
              {t("importExport.import.title")}
            </h2>
          </div>

          <div className="space-y-4">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("importExport.import.format")}
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="importFormat"
                    value="csv"
                    checked={importFormat === "csv"}
                    onChange={() => setImportFormat("csv")}
                    className="mr-2"
                  />
                  <span className="text-gray-700 dark:text-gray-300">CSV</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="importFormat"
                    value="excel"
                    checked={importFormat === "excel"}
                    onChange={() => setImportFormat("excel")}
                    className="mr-2"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    Excel
                  </span>
                </label>
              </div>
            </div>

            {/* Bank Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("importExport.import.bankName")}
              </label>
              <input
                type="text"
                value={importName}
                onChange={(e) => setImportName(e.target.value)}
                placeholder={t("importExport.import.bankNamePlaceholder")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t("importExport.import.optional")}
              </p>
            </div>

            {/* File Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("importExport.import.selectFile")}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept={importFormat === "csv" ? ".csv" : ".xlsx,.xls"}
                onChange={handleImport}
                className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
              />
            </div>

            {/* Import Success Message */}
            {importSuccess && (
              <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md">
                <FaCheck className="mr-2" />
                <span>{t("importExport.alerts.importSuccess")}</span>
              </div>
            )}

            {/* Import Result Stats */}
            {importResult && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {t("importExport.import.result", {
                    total: importResult.total,
                    added: importResult.added,
                    duplicates: importResult.duplicates,
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Export Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <FaFileExport
              className="text-green-600 dark:text-green-400 mr-2"
              size={20}
            />
            <h2 className="text-lg font-semibold dark:text-white">
              {t("importExport.export.title")}
            </h2>
          </div>

          <div className="space-y-4">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("importExport.export.format")}
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="csv"
                    checked={exportFormat === "csv"}
                    onChange={() => setExportFormat("csv")}
                    className="mr-2"
                  />
                  <span className="text-gray-700 dark:text-gray-300">CSV</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="excel"
                    checked={exportFormat === "excel"}
                    onChange={() => setExportFormat("excel")}
                    className="mr-2"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    Excel
                  </span>
                </label>
              </div>
            </div>

            {/* Bank Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("importExport.export.selectBank")}
              </label>
              <select
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">
                  {t("importExport.export.selectBankPlaceholder")}
                </option>
                {questionBanks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name} ({bank.questions.length}{" "}
                    {t("importExport.export.questions")})
                  </option>
                ))}
              </select>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={!selectedBankId}
              className={`w-full px-4 py-2 rounded-md font-semibold transition-colors ${
                selectedBankId
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              }`}
            >
              {t("importExport.export.button")}
            </button>

            {/* Export Success Message */}
            {exportSuccess && (
              <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md">
                <FaCheck className="mr-2" />
                <span>{t("importExport.alerts.exportSuccess")}</span>
              </div>
            )}

            {/* No Banks Warning */}
            {questionBanks.length === 0 && (
              <div className="flex items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-md">
                <FaExclamationTriangle className="mr-2" />
                <span>{t("importExport.alerts.noBanks")}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
