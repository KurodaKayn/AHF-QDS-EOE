"use client";

import { useEffect, useState } from "react";
import "@/i18n/config"; // Import i18n config to ensure early initialization
import { Toaster } from "sonner";
import { ThemeRegistry } from "./ThemeRegistry";
import { useQuizStore } from "@/store/quizStore";
import { saveAiConfigOnBackend } from "@/lib/aiConfigSync";

const isTauriRuntime =
  typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);

export function Providers({ children }: { children: React.ReactNode }) {
  // Avoid hydration mismatch between server-side and client-side rendering
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isTauriRuntime) return;

    const syncConfigs = async () => {
      const configs = useQuizStore.getState().settings.aiConfigs;
      await Promise.all(configs.map((config) => saveAiConfigOnBackend(config)));
    };

    const persistApi = useQuizStore.persist as
      | {
          hasHydrated?: () => boolean;
          onFinishHydration?: (cb: () => void) => () => void;
        }
      | undefined;

    if (persistApi?.hasHydrated?.()) {
      void syncConfigs();
      return;
    }

    const unsubscribe = persistApi?.onFinishHydration?.(() => {
      void syncConfigs();
    });

    return () => {
      unsubscribe?.();
    };
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
