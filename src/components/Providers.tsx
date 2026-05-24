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

  useEffect(() => {
    if (!isTauriRuntime) return;

    let timeout: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = useQuizStore.subscribe((state, prevState) => {
      if (state.questionBanks === prevState.questionBanks && state.records === prevState.records) {
        return;
      }

      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        void replaceQuizSnapshotOnBackend({
          questionBanks: useQuizStore.getState().questionBanks,
          records: useQuizStore.getState().records,
        });
      }, 150);
    });

    return () => {
      unsubscribe();
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, []);

  useEffect(() => {
    if (!isTauriRuntime) return;

    let cancelled = false;

    const syncQuizSnapshot = async () => {
      const backendSnapshot = await loadQuizSnapshotFromBackend();
      if (cancelled) return;

      const store = useQuizStore.getState();
      const localSnapshot = {
        questionBanks: store.questionBanks,
        records: store.records,
      };

      if (backendSnapshot && hasQuizSnapshotData(backendSnapshot)) {
        store.replaceQuizData(backendSnapshot);
        return;
      }

      if (localSnapshot.questionBanks.length > 0 || localSnapshot.records.length > 0) {
        await replaceQuizSnapshotOnBackend(localSnapshot);
      }
    };

    void syncQuizSnapshot();

    return () => {
      cancelled = true;
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
