import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useMediaQuery } from "@/hooks";

/**
 * Hook encapsulating layout responsiveness, sidebar toggle, and mobile menu state.
 * Co-located with QuizLayout.
 */
export function useQuizLayout() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 767px)");

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return {
    t,
    pathname,
    sidebarCollapsed,
    mobileMenuOpen,
    isMobile,
    toggleSidebar,
    toggleMobileMenu,
    closeMobileMenu,
  };
}
