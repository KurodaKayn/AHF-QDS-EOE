"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaExchangeAlt,
  FaCog,
  FaListUl,
  FaBars,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaSyncAlt,
} from "react-icons/fa";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

/**
 * Layout component for the quiz system
 * Supports responsive design, collapsible sidebar, and mobile bottom navigation
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
      icon: <Icon icon="mdi:note-remove-outline" className="text-xl" />,
      label: t("nav.review"),
    },
    { href: "/quiz/convert", icon: <FaSyncAlt />, label: t("nav.convert") },
    { href: "/quiz/settings", icon: <FaCog />, label: t("nav.settings") },
  ];

  // Screen size detection
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Mobile Top Navigation */}
      <div className="md:hidden flex-none flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-md z-20">
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

      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          "hidden md:flex flex-col flex-none h-full bg-white dark:bg-gray-800 shadow-md transition-all duration-300 border-r dark:border-gray-700 overflow-y-auto custom-scrollbar",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <div
          className={cn(
            "flex-none p-4 border-b border-gray-200 dark:border-gray-700 flex items-center sticky top-0 bg-white dark:bg-gray-800 z-10",
            sidebarCollapsed ? "justify-center" : "justify-between"
          )}
        >
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold text-gray-800 dark:text-white truncate">
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
        <nav className="flex-1 p-2">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-2 rounded-md transition-colors whitespace-nowrap",
                    "hover:bg-gray-100 dark:hover:bg-gray-700",
                    pathname === item.href
                      ? "bg-blue-50 text-blue-600 dark:bg-gray-700 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-200",
                    sidebarCollapsed && "justify-center"
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span
                    className={cn(
                      "flex-none",
                      sidebarCollapsed ? "text-lg" : "mr-3"
                    )}
                  >
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Mobile Menu - Drawer */}
      {isMobile && mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={toggleMobileMenu}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col h-full">
            <div className="flex-none p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
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
            <nav className="flex-1 p-4 overflow-y-auto">
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

      {/* Main Content Area */}
      <main
        className={cn(
          "flex-1 h-full overflow-y-auto overflow-x-hidden dark:text-gray-100 transition-all duration-300 relative custom-scrollbar",
          // Practice page doesn't need padding, others do
          pathname?.startsWith("/quiz/practice") ? "" : "p-4 md:p-8",
          // Mobile bottom padding to avoid nav overlap
          isMobile && !pathname?.startsWith("/quiz/practice") && "pb-24"
        )}
      >
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg z-30 border-t dark:border-gray-700">
          <div className="flex justify-around">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center py-3 px-2 flex-1",
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
