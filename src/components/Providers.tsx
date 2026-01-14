"use client";

import { useEffect, useState } from "react";
import "@/i18n/config"; // Import i18n config to ensure early initialization
import { Toaster } from "sonner";
import { ThemeRegistry } from "./ThemeRegistry";

export function Providers({ children }: { children: React.ReactNode }) {
  // Avoid hydration mismatch between server-side and client-side rendering
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Or return a loading placeholder
  }

  return (
    <>
      <ThemeRegistry />
      <Toaster position="top-center" />
      {children}
    </>
  );
}
