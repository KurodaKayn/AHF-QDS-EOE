"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "react-icons/fa";

import { cn } from "@/lib/utils";

import { useTranslation } from "react-i18next";

// 导航项定义 (Removed static definition)

/**
 * 刷题系统的布局组件
 * 支持响应式设计，侧边栏可收起，移动端底部导航
 */
export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: "/quiz", icon: <FaListUl />, label: t("nav.home") },
    {
      href: "/quiz/import-export",
      icon: <FaExchangeAlt />,
      label: t("nav.importExport"),
    },
    {
      href: "/quiz/review",
      icon: <FaExclamationTriangle />,
      label: t("nav.review"),
    },
    { href: "/quiz/convert", icon: <FaSyncAlt />, label: t("nav.convert") },
    { href: "/quiz/settings", icon: <FaCog />, label: t("nav.settings") },
  ];

  // 检测屏幕尺寸
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    // 初始检查
    checkIsMobile();

    // 监听窗口大小变化
    window.addEventListener("resize", checkIsMobile);

    // 清理
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // 切换侧边栏状态
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // 切换移动菜单
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 移动端顶部导航栏 */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-md">
        <div className="flex items-center">
          <button
            onClick={toggleMobileMenu}
            className="mr-3 text-gray-700 dark:text-gray-200"
            aria-label={t("nav.openMenu")}
          >
            {mobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            {t("nav.title")}
          </h1>
        </div>
      </div>

      {/* 侧边栏 - 桌面版 */}
      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-30 bg-white dark:bg-gray-800 shadow-md transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64",
          isMobile && "hidden"
        )}
      >
        <div
          className={cn(
            "p-4 border-b border-gray-200 dark:border-gray-700 flex items-center",
            sidebarCollapsed ? "justify-center" : "justify-between"
          )}
        >
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              {t("nav.title")}
            </h1>
          )}
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className={cn(
                "ml-2 p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700",
                sidebarCollapsed && "mx-auto"
              )}
              aria-label={
                sidebarCollapsed
                  ? t("nav.expandSidebar")
                  : t("nav.collapseSidebar")
              }
            >
              {sidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
            </button>
          </div>
        </div>
        <nav className="p-2">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-2 rounded-md transition-colors",
                    "hover:bg-gray-100 dark:hover:bg-gray-700",
                    pathname === item.href
                      ? "bg-blue-50 text-blue-600 dark:bg-gray-700 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-200",
                    sidebarCollapsed && "justify-center"
                  )}
                >
                  <span className={sidebarCollapsed ? "text-lg" : "mr-3"}>
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* 移动端菜单 - 侧滑抽屉 */}
      {isMobile && mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={toggleMobileMenu}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                {t("nav.title")}
              </h1>
              <button
                onClick={toggleMobileMenu}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label={t("nav.closeMenu")}
              >
                <FaTimes size={20} />
              </button>
            </div>
            <nav className="p-4">
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center px-4 py-3 rounded-md",
                        "hover:bg-gray-100 dark:hover:bg-gray-700",
                        pathname === item.href
                          ? "bg-blue-50 text-blue-600 dark:bg-gray-700 dark:text-blue-400"
                          : "text-gray-700 dark:text-gray-200"
                      )}
                      onClick={toggleMobileMenu}
                    >
                      <span className="mr-3 text-lg">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </>
      )}

      {/* 主内容区 */}
      <main
        className={cn(
          "flex-1 p-4 md:p-8 dark:text-gray-100 transition-all duration-300",
          !isMobile && sidebarCollapsed && "md:ml-16"
        )}
      >
        {children}
      </main>

      {/* 移动端底部导航 */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg z-30">
          <div className="flex justify-around">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center py-3 px-2",
                  pathname === item.href
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400"
                )}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
