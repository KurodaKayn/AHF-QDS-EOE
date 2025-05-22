'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';

/**
 * 注册页面组件
 * 提供用户注册表单和功能
 */
export default function RegisterPage() {
  const router = useRouter();
  const { register, error, loading } = useAuthStore();
  const { isLoading } = useAuth(false); // 不需要认证才能访问注册页面
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  /**
   * 处理注册表单提交
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // 表单验证
    if (!username.trim()) {
      setFormError('请输入用户名');
      return;
    }
    
    if (username.length < 3) {
      setFormError('用户名长度不能小于3个字符');
      return;
    }
    
    if (!password) {
      setFormError('请输入密码');
      return;
    }
    
    if (password.length < 6) {
      setFormError('密码长度不能小于6个字符');
      return;
    }
    
    if (password !== confirmPassword) {
      setFormError('两次输入的密码不一致');
      return;
    }
    
    if (email && !validateEmail(email)) {
      setFormError('请输入有效的电子邮箱地址');
      return;
    }
    
    try {
      await register(username, password, email || undefined);
      router.push('/quiz'); // 注册成功后跳转到题库页面
    } catch (err) {
      // 错误已经在 store 中被设置，这里不需要额外处理
    }
  };
  
  /**
   * 验证邮箱格式
   */
  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">加载中...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">注册账户</CardTitle>
          <CardDescription>
            创建您的账户访问题库系统
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
                placeholder="请输入用户名（至少3个字符）"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password" 
                type="password"
                placeholder="请输入密码（至少6个字符）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword" 
                type="password"
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">电子邮箱（可选）</Label>
              <Input
                id="email" 
                type="email"
                placeholder="请输入电子邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? '注册中...' : '注册'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-gray-500 dark:text-gray-400">
            已有账户？ <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">立即登录</Link>
          </div>
          <div className="text-sm text-center text-gray-500 dark:text-gray-400">
            <Link href="/" className="text-blue-600 hover:underline dark:text-blue-400">返回首页</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 