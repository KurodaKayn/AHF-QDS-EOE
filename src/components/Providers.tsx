"use client";

import { useEffect, useState } from "react";
import "@/i18n/config"; // Import i18n config to ensure early initialization
import { Toaster } from "sonner";
import { ThemeRegistry } from "./ThemeRegistry";
import { useQuizStore } from "@/store/quizStore";
import { saveAiConfigOnBackend } from "@/lib/aiConfigSync";
import {
  hasQuizSnapshotData,
  loadQuizSnapshotFromBackend,
  replaceQuizSnapshotOnBackend,
} from "@/lib/quizSnapshotSync";

import { isTauriRuntime } from "@/lib/runtime";

export function Providers({ children }: { children: React.ReactNode }) {
  // Avoid hydration mismatch between server-side and client-side rendering
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isTauriRuntime()) return;

    let cancelled = false;

    const runStartupSync = async () => {
      const store = useQuizStore.getState();

      // 1. Sync AI configs to backend
      const configs = store.settings.aiConfigs;
      await Promise.all(configs.map((config) => saveAiConfigOnBackend(config)));
      if (cancelled) return;

      // 2. Sync Quiz snapshot between backend and local state
      const backendSnapshot = await loadQuizSnapshotFromBackend();
      if (cancelled) return;

      const currentStore = useQuizStore.getState();
      const localSnapshot = {
        questionBanks: currentStore.questionBanks,
        records: currentStore.records,
      };

      if (backendSnapshot && hasQuizSnapshotData(backendSnapshot)) {
        currentStore.replaceQuizData(backendSnapshot);
      } else if (localSnapshot.questionBanks.length > 0 || localSnapshot.records.length > 0) {
        await replaceQuizSnapshotOnBackend(localSnapshot);
      }
    };

    const persistApi = useQuizStore.persist as
      | {
          hasHydrated?: () => boolean;
          onFinishHydration?: (cb: () => void) => () => void;
        }
      | undefined;

    if (persistApi?.hasHydrated?.()) {
      void runStartupSync();
      return;
    }

    const unsubscribe = persistApi?.onFinishHydration?.(() => {
      void runStartupSync();
    });

    return () => {
      cancelled = true;
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
