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
  openai: string;
  anthropic: string;
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
    openai: '',
    anthropic: '',
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
    if (!isReady) return;
    
    updateSetting('theme', value);
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
            
            {/* 练习选项随机排序 */}
            <BooleanSetting 
              label="练习选项随机排序" 
              description="启用后，练习中的选项顺序将被随机打乱"
              value={settings.shufflePracticeOptions} 
              onChange={() => handleBooleanSettingToggle('shufflePracticeOptions')}
              tooltip="这有助于避免记住选项位置而非内容"
            />
            
            <Separator />
            
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
            
            <Separator />
            
            {/* 自动保存 */}
            <BooleanSetting 
              label="自动保存进度" 
              description="自动保存练习进度，下次可以继续未完成的练习" 
              value={settings.autoSaveProgress} 
              onChange={() => handleBooleanSettingToggle('autoSaveProgress')}
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
            <TextInputSetting 
              label="OpenAI API 密钥" 
              description="用于高级问答和练习生成" 
              value={apiKeySettings.openai} 
              onChange={(value) => handleApiKeySetting('openai', value)}
              placeholder="sk-..."
              tooltip="密钥仅存储在您的浏览器中，不会发送到我们的服务器"
            />
            
            <Separator />
            
            <TextInputSetting 
              label="Anthropic API 密钥" 
              description="用于替代 OpenAI 的问答和练习生成" 
              value={apiKeySettings.anthropic} 
              onChange={(value) => handleApiKeySetting('anthropic', value)}
              placeholder="sk-ant-..."
              tooltip="密钥仅存储在您的浏览器中，不会发送到我们的服务器"
            />
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