'use client';

import { FormEvent, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';

/**
 * 登录页面组件
 * 提供用户登录表单和功能
 */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/quiz';
  
  const { login, error, loading } = useAuthStore();
  const { isLoading } = useAuth(false); // 不需要认证才能访问登录页面
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  /**
   * 处理登录表单提交
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // 表单验证
    if (!username.trim()) {
      setFormError('请输入用户名');
      return;
    }
    
    if (!password) {
      setFormError('请输入密码');
      return;
    }
    
    try {
      await login(username, password);
      // 登录成功后重定向到returnUrl
      router.push(decodeURIComponent(returnUrl));
    } catch (err) {
      // 错误已经在 store 中被设置，这里不需要额外处理
    }
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">加载中...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">登录账户</CardTitle>
          <CardDescription>
            请输入您的账户信息登录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {(formError || error) && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  {formError || error}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">密码</Label>
              </div>
              <Input
                id="password" 
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-gray-500 dark:text-gray-400">
            还没有账户？ <Link href="/register" className="text-blue-600 hover:underline dark:text-blue-400">立即注册</Link>
          </div>
          <div className="text-sm text-center text-gray-500 dark:text-gray-400">
            <Link href="/" className="text-blue-600 hover:underline dark:text-blue-400">返回首页</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 