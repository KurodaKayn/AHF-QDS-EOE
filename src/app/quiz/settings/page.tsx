'use client';

import { useQuizStore, QuizSettings } from '@/store/quizStore';
import Image from 'next/image'; // Import Image component for logos
// FiChevronLeft is no longer needed

// Helper component for individual boolean settings
interface SettingRowProps {
  label: string;
  description?: string;
  settingKey: keyof Pick<QuizSettings, 'shufflePracticeOptions' | 'shuffleReviewOptions' | 'shufflePracticeQuestionOrder' | 'shuffleReviewQuestionOrder' | 'markMistakeAsCorrectedOnReviewSuccess'>;
  currentValue: boolean;
  onToggle: (key: SettingRowProps['settingKey'], value: boolean) => void;
}

const SettingRow: React.FC<SettingRowProps> = ({ 
  label, 
  description,
  settingKey,
  currentValue, 
  onToggle 
}) => {
  return (
    <div className="py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
      <div>
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">{label}</h3>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        )}
      </div>
      <button 
        onClick={() => onToggle(settingKey, !currentValue)}
        className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors w-24 text-center
          ${currentValue ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200'}
        `}
      >
        {currentValue ? '已启用' : '已禁用'}
      </button>
    </div>
  );
};

// Helper component for text input settings
interface TextInputSettingProps {
  label: string;
  settingKey: keyof Pick<QuizSettings, 'deepseekApiKey' | 'deepseekBaseUrl' | 'alibabaApiKey'>;
  currentValue: string;
  placeholder?: string;
  onUpdate: (key: TextInputSettingProps['settingKey'], value: string) => void;
  type?: string;
}

const TextInputSetting: React.FC<TextInputSettingProps> = ({ 
  label, 
  settingKey, 
  currentValue, 
  placeholder,
  onUpdate,
  type = 'text' 
}) => {
  return (
    <div className="py-4 border-b border-gray-200 dark:border-gray-700">
      <label htmlFor={settingKey} className="block text-lg font-medium text-gray-800 dark:text-gray-100">{label}</label>
      <form onSubmit={(e) => e.preventDefault()} className="m-0 p-0">
        <input 
          type={type}
          id={settingKey}
          value={currentValue}
          onChange={(e) => onUpdate(settingKey, e.target.value)}
          placeholder={placeholder}
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </form>
    </div>
  );
};

// 添加这个函数用于获取资源路径
function getAssetPath(filename: string) {
  // 检查是否在Electron环境中
  const isElectron = typeof window !== 'undefined' && window && 'electron' in window;
  
  if (isElectron) {
    // 在Electron打包环境中，logo可能位于不同位置
    return `/app.asar.unpacked/public/logo/${filename}`;
  }
  
  // 普通Web环境
  return `/logo/${filename}`;
}

export default function SettingsPage() {
  const { settings, setQuizSetting, resetQuizSettings } = useQuizStore();

  // Explicitly type the key for boolean settings
  type BooleanSettingKey = Extract<keyof QuizSettings, 'shufflePracticeOptions' | 'shuffleReviewOptions' | 'shufflePracticeQuestionOrder' | 'shuffleReviewQuestionOrder' | 'markMistakeAsCorrectedOnReviewSuccess'>;
  type StringSettingKey = Extract<keyof QuizSettings, 'deepseekApiKey' | 'deepseekBaseUrl' | 'alibabaApiKey'>;
  type AiProviderKey = Extract<keyof QuizSettings, 'aiProvider'>;

  const handleBooleanSettingToggle = (key: BooleanSettingKey, value: boolean) => {
    setQuizSetting(key, value);
  };

  const handleStringSettingUpdate = (key: StringSettingKey, value: string) => {
    setQuizSetting(key, value);
  };
  
  const handleAiProviderChange = (value: 'deepseek' | 'alibaba') => {
    setQuizSetting('aiProvider', value);
  };

  const ALIBABA_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";

  return (
    <>
      <header className="mb-8">
        <div className="max-w-3xl mx-auto flex items-center justify-center"> {/* Modified for centering title */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
              应用设置
            </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 md:p-8 divide-y divide-gray-200 dark:divide-gray-700">
        {/* General Practice/Review Settings */}
        <div className="space-y-4 py-6">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">练习与复习设置</h2>
          <SettingRow 
            label="练习模式：打乱选项顺序"
            description="单选题和多选题的选项将随机排列。"
            settingKey="shufflePracticeOptions"
            currentValue={settings.shufflePracticeOptions}
            onToggle={handleBooleanSettingToggle}
          />
          <SettingRow 
            label="错题回顾：打乱选项顺序"
            description="错题练习中，单选题和多选题的选项将随机排列。"
            settingKey="shuffleReviewOptions"
            currentValue={settings.shuffleReviewOptions}
            onToggle={handleBooleanSettingToggle}
          />
          <SettingRow 
            label="练习模式：打乱题目顺序"
            description="进入练习时，题库中的题目将以随机顺序出现。"
            settingKey="shufflePracticeQuestionOrder"
            currentValue={settings.shufflePracticeQuestionOrder}
            onToggle={handleBooleanSettingToggle}
          />
          <SettingRow 
            label="错题回顾：打乱题目顺序"
            description="进行错题回顾时，错题将以随机顺序出现。"
            settingKey="shuffleReviewQuestionOrder"
            currentValue={settings.shuffleReviewQuestionOrder}
            onToggle={handleBooleanSettingToggle}
          />
          <SettingRow 
            label="错题订正后从错题本移除"
            description="在错题回顾中答对题目后，是否将其视为已订正。"
            settingKey="markMistakeAsCorrectedOnReviewSuccess"
            currentValue={settings.markMistakeAsCorrectedOnReviewSuccess}
            onToggle={handleBooleanSettingToggle}
          />
        </div>

        {/* AI Provider Settings */}
        <div className="py-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">题目转换 AI 设置</h2>
          
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="block text-lg font-medium text-gray-800 dark:text-gray-100">选择 AI 服务商:</label>
            <div className="flex flex-col sm:flex-row gap-4">
              {([
                { id: 'deepseek', name: 'Deepseek', logoFile: 'Deepseek.jpg' },
                { id: 'alibaba', name: '通义千问 (Alibaba)', logoFile: 'Qwen.jpg' },
              ] as const).map((provider) => (
                <button 
                  key={provider.id} 
                  onClick={() => handleAiProviderChange(provider.id)}
                  className={`flex-1 p-4 border rounded-lg flex items-center justify-center space-x-3 transition-all duration-200 ease-in-out 
                    ${settings.aiProvider === provider.id 
                      ? provider.id === 'deepseek'
                        ? 'bg-blue-800 border-blue-900 text-white shadow-lg ring-2 ring-blue-700 ring-offset-2 dark:ring-offset-gray-800' 
                        : 'bg-purple-800 border-purple-900 text-white shadow-lg ring-2 ring-purple-700 ring-offset-2 dark:ring-offset-gray-800'
                      : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'}
                  `}
                >
                  <span className="font-medium">{provider.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Deepseek Settings - Conditional on provider or always show and disable? For now, conditional */}
          {settings.aiProvider === 'deepseek' && (
            <div className="p-4 border border-blue-200 dark:border-blue-900 rounded-lg bg-blue-50 dark:bg-blue-900/20 space-y-4">
              <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300">Deepseek 设置</h3>
              <TextInputSetting 
                label="Deepseek API Key"
                settingKey="deepseekApiKey"
                currentValue={settings.deepseekApiKey}
                onUpdate={handleStringSettingUpdate}
                placeholder="输入您的 Deepseek API Key"
                type="password"
              />
              <TextInputSetting 
                label="Deepseek Base URL"
                settingKey="deepseekBaseUrl"
                currentValue={settings.deepseekBaseUrl}
                onUpdate={handleStringSettingUpdate}
                placeholder="例如: https://api.deepseek.com"
              />
            </div>
          )}

          {/* Alibaba Settings - Conditional on provider */}
          {settings.aiProvider === 'alibaba' && (
            <div className="p-4 border border-purple-200 dark:border-purple-900 rounded-lg bg-purple-50 dark:bg-purple-900/20 space-y-4">
              <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300">通义千问 (Alibaba) 设置</h3>
              <TextInputSetting 
                label="Alibaba API Key (DashScope)"
                settingKey="alibabaApiKey"
                currentValue={settings.alibabaApiKey}
                onUpdate={handleStringSettingUpdate}
                placeholder="输入您的 DashScope API Key (sk-...)"
                type="password"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Base URL (固定)</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 p-2 rounded-md">{ALIBABA_BASE_URL}</p>
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">默认模型 (固定)</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 p-2 rounded-md">qwen-turbo (兼容 OpenAI SDK)</p>
              </div>
            </div>
          )}
        </div>

        {/* Reset Settings Button */}
        <div className="mt-8 pt-6 flex justify-end">
          <button 
            onClick={resetQuizSettings}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-md font-medium transition-colors"
          >
            恢复默认设置
          </button>
        </div>
      </main>
    </>
  );
} 