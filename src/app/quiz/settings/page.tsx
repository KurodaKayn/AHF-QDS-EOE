'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useUserSettings } from '@/hooks/useUserSettings';
import { UserSettingsData } from '@/lib/userSettings';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoCircledIcon } from '@radix-ui/react-icons';

interface ApiKeySettings {
  deepseekApiKey: string;
  deepseekBaseUrl: string;
  alibabaApiKey: string;
  provider: 'deepseek' | 'alibaba';
}

/**
 * 布尔设置项组件
 */
const BooleanSetting = ({ 
  label, 
  description,
  value, 
  onChange,
  tooltip
}: { 
  label: string; 
  description: string; 
  value: boolean; 
  onChange: (value: boolean) => void;
  tooltip?: string;
}) => {
  return (
    <div className="flex items-center justify-between space-y-2 py-4">
      <div className="flex flex-col space-y-1">
        <div className="flex items-center">
          <Label htmlFor={label.toLowerCase().replace(/\s+/g, '-')} className="mr-2">{label}</Label>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoCircledIcon className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch
        id={label.toLowerCase().replace(/\s+/g, '-')}
        checked={value}
        onCheckedChange={onChange}
      />
    </div>
  );
};

/**
 * 文本输入设置项组件
 */
const TextInputSetting = ({ 
  label, 
  description, 
  value, 
  onChange,
  placeholder = '',
  tooltip
}: { 
  label: string;
  description: string; 
  value: string; 
  onChange: (value: string) => void;
  placeholder?: string;
  tooltip?: string;
}) => {
  return (
    <div className="flex flex-col space-y-2 py-4">
      <div className="flex items-center">
        <Label htmlFor={label.toLowerCase().replace(/\s+/g, '-')} className="mr-2">{label}</Label>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoCircledIcon className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Input
        id={label.toLowerCase().replace(/\s+/g, '-')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        className="mt-2"
        />
    </div>
  );
};

/**
 * 设置页面组件
 */
export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [apiKeySettings, setApiKeySettings] = useState<ApiKeySettings>({
    deepseekApiKey: '',
    deepseekBaseUrl: 'https://api.deepseek.com',
    alibabaApiKey: '',
    provider: 'deepseek'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  // 使用用户设置 Hook
  const { 
    settings, 
    isLoading, 
    error, 
    updateSetting, 
    resetSettings
  } = useUserSettings();

  // 从本地存储加载 API 密钥
  useEffect(() => {
    if (typeof window !== 'undefined' && status !== 'loading') {
      const storedSettings = localStorage.getItem('apiKeySettings');
      if (storedSettings) {
        try {
          setApiKeySettings(JSON.parse(storedSettings));
        } catch (e) {
          console.error('解析存储的 API 密钥设置时出错:', e);
        }
      }
      setIsReady(true);
    }
  }, [status]);

  // 保存 API 密钥到本地存储
  const saveApiKeys = async () => {
    try {
      setIsSaving(true);
      localStorage.setItem('apiKeySettings', JSON.stringify(apiKeySettings));
      toast.success('API 密钥已保存');
    } catch (error) {
      toast.error('保存 API 密钥失败');
      console.error('保存 API 密钥失败:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 处理布尔设置切换
  const handleBooleanSettingToggle = (settingKey: keyof UserSettingsData) => {
    if (!isReady) return;
    
    updateSetting(settingKey, !settings[settingKey]);
  };

  // 处理主题设置变更
  const handleThemeChange = (value: 'light' | 'dark' | 'system') => {
    if (isReady) {
      updateSetting('theme', value);
    }
  };

  // 处理 API 密钥设置更新
  const handleApiKeySetting = (key: keyof ApiKeySettings, value: string) => {
    setApiKeySettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 重置所有用户设置
  const handleResetUserSettings = async () => {
    try {
      await resetSettings();
      toast.success('用户设置已重置为默认值');
    } catch (error: any) {
      toast.error('重置用户设置失败');
      console.error('重置用户设置失败:', error);
    }
  };

  // 修改主题切换相关的useEffect
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 根据当前主题设置应用相应的类
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // 初始设置
      document.documentElement.classList.toggle('dark', mediaQuery.matches);
      
      // 监听变化
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle('dark', e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, [settings.theme]);

  if (status === 'loading' || isLoading) {
    return <div className="flex justify-center items-center min-h-screen">加载中...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <p className="text-red-500">加载设置时出错</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">设置</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 用户偏好设置 */}
        <Card>
          <CardHeader>
            <CardTitle>用户偏好</CardTitle>
            <CardDescription>调整学习体验</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* 主题设置 */}
            <div className="flex flex-col space-y-2 py-4">
              <Label>主题</Label>
              <p className="text-sm text-muted-foreground">选择应用主题</p>
              <div className="flex space-x-2 mt-2">
                <Button 
                  variant={settings.theme === 'light' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => handleThemeChange('light')}
                >
                  亮色
                </Button>
                <Button 
                  variant={settings.theme === 'dark' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => handleThemeChange('dark')}
                >
                  暗色
                </Button>
                <Button 
                  variant={settings.theme === 'system' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => handleThemeChange('system')}
                >
                  系统
                </Button>
              </div>
        </div>

            <Separator />

            <div className="py-2 font-medium">练习与复习设置</div>
            
            {/* 练习选项随机排序 */}
            <BooleanSetting 
            label="练习模式：打乱选项顺序"
              description="单选题和多选题的选项将随机排列"
              value={settings.shufflePracticeOptions} 
              onChange={() => handleBooleanSettingToggle('shufflePracticeOptions')}
              tooltip="这有助于避免记住选项位置而非内容"
            />
            
            <Separator />
            
            {/* 错题回顾选项随机排序 */}
            <BooleanSetting 
            label="错题回顾：打乱选项顺序"
              description="错题练习中，单选题和多选题的选项将随机排列" 
              value={settings.shuffleReviewOptions} 
              onChange={() => handleBooleanSettingToggle('shuffleReviewOptions')}
              tooltip="避免对选项位置的记忆干扰学习效果"
            />
            
            <Separator />
            
            {/* 练习模式打乱题目顺序 */}
            <BooleanSetting 
            label="练习模式：打乱题目顺序"
              description="进入练习时，题库中的题目将以随机顺序出现" 
              value={settings.shufflePracticeQuestionOrder} 
              onChange={() => handleBooleanSettingToggle('shufflePracticeQuestionOrder')}
              tooltip="帮助打破固定顺序，提高学习效果"
            />
            
            <Separator />
            
            {/* 错题回顾打乱题目顺序 */}
            <BooleanSetting 
            label="错题回顾：打乱题目顺序"
              description="进行错题回顾时，错题将以随机顺序出现" 
              value={settings.shuffleReviewQuestionOrder} 
              onChange={() => handleBooleanSettingToggle('shuffleReviewQuestionOrder')}
              tooltip="帮助打破固定顺序，提高复习效果"
            />
            
            <Separator />
            
            {/* 错题订正后从错题本移除 */}
            <BooleanSetting 
            label="错题订正后从错题本移除"
              description="在错题回顾中答对题目后，是否将其视为已订正" 
              value={settings.markMistakeAsCorrectedOnReviewSuccess} 
              onChange={() => handleBooleanSettingToggle('markMistakeAsCorrectedOnReviewSuccess')}
              tooltip="开启后可减少已掌握的错题重复出现"
            />
            
            <Separator />
            
            {/* 导入题目检查重复 */}
            <BooleanSetting 
            label="导入题目时查重"
              description="导入题库时会自动跳过重复题目（题干完全一致视为重复）" 
              value={settings.checkDuplicateQuestion} 
              onChange={() => handleBooleanSettingToggle('checkDuplicateQuestion')}
              tooltip="防止相同题目重复导入，保持题库整洁"
            />
            
            <Separator />
            
            <div className="py-2 font-medium">练习体验设置</div>
            
            {/* 显示详细解释 */}
            <BooleanSetting 
              label="显示详细解释" 
              description="在回答问题后显示详细的解释和知识点" 
              value={settings.showDetailedExplanations} 
              onChange={() => handleBooleanSettingToggle('showDetailedExplanations')}
              tooltip="关闭此选项将只显示简要解释"
            />
            
            <Separator />
            
            {/* 自动继续 */}
            <BooleanSetting 
              label="自动继续" 
              description="回答后自动继续下一题，而不需要点击" 
              value={settings.autoContinue} 
              onChange={() => handleBooleanSettingToggle('autoContinue')}
              tooltip="适合快速练习模式"
            />
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="mr-2" 
              onClick={handleResetUserSettings}
              disabled={isLoading}
            >
              重置为默认值
            </Button>
          </CardFooter>
        </Card>
        
        {/* API 密钥设置 */}
        <Card>
          <CardHeader>
            <CardTitle>API 密钥</CardTitle>
            <CardDescription>设置第三方 API 密钥</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* 先选择AI服务商 */}
            <div className="py-4 space-y-2">
              <Label>选择 AI 服务商</Label>
              <p className="text-sm text-muted-foreground">选择用于题目转换的AI服务提供商</p>
              <div className="flex space-x-2 mt-2">
                <Button 
                  variant={apiKeySettings.provider === 'deepseek' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => handleApiKeySetting('provider', 'deepseek')}
                >
                  Deepseek
                </Button>
                <Button 
                  variant={apiKeySettings.provider === 'alibaba' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => handleApiKeySetting('provider', 'alibaba')}
                >
                  通义千问
                </Button>
              </div>
            </div>

            <Separator />

            {/* 根据选择的服务商显示对应的密钥输入框 */}
            {apiKeySettings.provider === 'deepseek' && (
              <TextInputSetting 
                label="Deepseek API 密钥" 
                description="用于高级问答和练习生成" 
                value={apiKeySettings.deepseekApiKey} 
                onChange={(value) => handleApiKeySetting('deepseekApiKey', value)}
                placeholder="输入您的 Deepseek API Key"
                tooltip="密钥仅存储在您的浏览器中，不会发送到我们的服务器"
              />
            )}

            {apiKeySettings.provider === 'alibaba' && (
              <TextInputSetting 
                label="通义千问 API 密钥" 
                description="阿里云通义千问API密钥" 
                value={apiKeySettings.alibabaApiKey} 
                onChange={(value) => handleApiKeySetting('alibabaApiKey', value)}
                placeholder="sk-..."
                tooltip="密钥仅存储在您的浏览器中，不会发送到我们的服务器"
              />
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={saveApiKeys} 
              disabled={isSaving}
            >
              {isSaving ? '保存中...' : '保存 API 密钥'}
            </Button>
          </CardFooter>
        </Card>
              </div>
            </div>
  );
} 