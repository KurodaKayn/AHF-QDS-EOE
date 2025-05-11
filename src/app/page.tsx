'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-50 dark:bg-gray-900">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-5 sm:px-20 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold mt-10 mb-8 text-gray-900 dark:text-white">
          欢迎访问
        </h1>
        <p className="mt-3 text-xl text-gray-700 dark:text-gray-300">
          请选择您想要访问的应用:
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
        </div>
      </main>
    </div>
  );
}
