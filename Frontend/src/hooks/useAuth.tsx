'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

/**
 * 认证钩子，用于路由保护
 * @param requireAuth 是否需要认证才能访问，默认为true
 * @returns 认证状态信息
 */
export function useAuth(requireAuth: boolean = true) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      setIsLoading(true);
      try {
        // 检查用户认证状态
        const authenticated = await checkAuth();
        
        // 如果需要认证但未认证，重定向到登录页面
        if (requireAuth && !authenticated) {
          // 保存原始URL，登录成功后可以返回
          const returnUrl = encodeURIComponent(pathname);
          router.push(`/login?returnUrl=${returnUrl}`);
          return;
        }
        
        // 如果已认证但访问的是登录/注册页面，重定向到首页
        if (authenticated && !requireAuth && (pathname === '/login' || pathname === '/register')) {
          router.push('/');
          return;
        }
        
        setIsVerified(true);
      } catch (error) {
        console.error('认证验证失败:', error);
        if (requireAuth) {
          router.push('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [checkAuth, isAuthenticated, pathname, requireAuth, router]);

  return { isLoading, isAuthenticated, isVerified };
} 