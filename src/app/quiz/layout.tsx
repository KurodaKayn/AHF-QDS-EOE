import React from 'react';
import Link from 'next/link';
import { FaBook, FaPencilAlt, FaExchangeAlt, FaExclamationTriangle, FaCog } from 'react-icons/fa';

/**
 * 刷题系统的布局组件
 */
export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 侧边栏 */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">刷题系统</h1>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link 
                href="/quiz" 
                className="flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100"
              >
                <FaBook className="mr-3" />
                <span>题库管理</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/quiz/import-export" 
                className="flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100"
              >
                <FaExchangeAlt className="mr-3" />
                <span>导入/导出</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/quiz/practice"
                className="flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100"
              >
                <FaPencilAlt className="mr-3" />
                <span>开始练习</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/quiz/review" 
                className="flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100"
              >
                <FaExclamationTriangle className="mr-3" />
                <span>错题本</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/quiz/convert" 
                className="flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100"
              >
                <FaCog className="mr-3" />
                <span>题目转换</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
      
      {/* 主内容区 */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
} 