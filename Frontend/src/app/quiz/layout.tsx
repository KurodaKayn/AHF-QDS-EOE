'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  FaBook, 
  FaPencilAlt, 
  FaExchangeAlt, 
  FaExclamationTriangle, 
  FaCog, 
  FaListUl, 
  FaBars, 
  FaTimes, 
  FaChevronLeft,
  FaChevronRight,
  FaRandom,
  FaSyncAlt,
  FaSignOutAlt
} from 'react-icons/fa';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';

// 导航项定义
const navItems = [
  { href: '/quiz', icon: <FaListUl />, label: '刷题，启动！' },
  { href: '/quiz/import-export', icon: <FaExchangeAlt />, label: '导入/导出' },
  { href: '/quiz/review', icon: <FaExclamationTriangle />, label: '错题本' },
  { href: '/quiz/convert', icon: <FaSyncAlt />, label: '题目转换' },
  { href: '/quiz/settings', icon: <FaCog />, label: '应用设置' },
];

/**
 * 刷题系统的布局组件
 * 支持响应式设计，侧边栏可收起，移动端底部导航
 */
export default function QuizLayout({ children }: { children: React.ReactNode }) {
  // 使用useAuth钩子保护路由，要求用户登录
  const { isLoading, isVerified } = useAuth(true);
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // 加载状态时显示加载指示器
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">加载中...</div>
      </div>
    );
  }

  // 如果未通过认证验证，则不渲染内容（将由useAuth重定向）
  if (!isVerified) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* 移动端菜单按钮 */}
      <button
        className="fixed z-30 bottom-4 right-4 p-3 rounded-full bg-blue-600 text-white shadow-lg block md:hidden"
        onClick={toggleSidebar}
        aria-label="Toggle Menu"
      >
        {sidebarOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* 侧边栏 */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-20 w-64 bg-white dark:bg-gray-800 transform transition-transform duration-300 ease-in-out shadow-lg md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          <div className="px-4 py-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">刷题系统</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {user?.username ? `欢迎，${user.username}` : '欢迎使用'}
            </p>
          </div>

          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                    isActive && "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                  )}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="mr-3"><FaSignOutAlt /></span>
              <span>退出登录</span>
            </button>
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <ThemeSwitcher />
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
} 