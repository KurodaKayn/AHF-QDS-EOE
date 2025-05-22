'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

/**
 * 应用首页组件
 * 根据用户登录状态显示不同内容
 */
export default function Home() {
  const { data: session } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ redirect: false });
    setIsLoggingOut(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-50 dark:bg-gray-900">
      <header className="w-full max-w-6xl px-5 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">刷题系统</h1>
        {session ? (
          <div className="flex items-center gap-4">
            <span className="text-gray-700 dark:text-gray-300">
              你好，{session.user.name}
            </span>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
            >
              {isLoggingOut ? '退出中...' : '退出登录'}
            </button>
          </div>
        ) : (
          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-blue-600 rounded-md border border-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              登录
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              注册
            </Link>
          </div>
        )}
      </header>

      <main className="flex flex-col items-center justify-center w-full flex-1 px-5 sm:px-20 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold mt-10 mb-8 text-gray-900 dark:text-white">
          欢迎访问
        </h1>
        
        {session ? (
          <>
            <p className="mt-3 text-xl text-gray-700 dark:text-gray-300">
              请选择您想要访问的模块:
            </p>
            <div className="flex flex-wrap items-center justify-center max-w-4xl mt-6 sm:w-full">
              <Link
                href="/quiz"
                className="p-6 m-2 text-left border w-72 sm:w-96 rounded-xl hover:text-blue-600 focus:text-blue-600 hover:border-blue-600 transition duration-300 dark:border-gray-700 dark:hover:border-blue-500 dark:focus:border-blue-500 dark:hover:text-blue-400 dark:focus:text-blue-400"
              >
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">刷题系统 &rarr;</h3>
                <p className="mt-4 text-gray-700 dark:text-gray-400">
                  练习题目，记录错题并支持导入导出题库
                </p>
              </Link>
              
              <Link
                href="/quiz/settings"
                className="p-6 m-2 text-left border w-72 sm:w-96 rounded-xl hover:text-blue-600 focus:text-blue-600 hover:border-blue-600 transition duration-300 dark:border-gray-700 dark:hover:border-blue-500 dark:focus:border-blue-500 dark:hover:text-blue-400 dark:focus:text-blue-400"
              >
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">设置 &rarr;</h3>
                <p className="mt-4 text-gray-700 dark:text-gray-400">
                  管理API密钥和个人偏好设置
                </p>
              </Link>
            </div>
          </>
        ) : (
          <div className="mt-8">
            <p className="text-xl text-gray-700 dark:text-gray-300">
              请登录或注册以访问完整功能
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="px-8 py-3 text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                登录账号
              </Link>
              <Link
                href="/register"
                className="px-8 py-3 text-base font-medium text-blue-600 bg-white rounded-md border border-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                注册新账号
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
