import { useEffect } from "react";
import { useQuizStore } from "@/store/quizStore";
import { saveAiConfigOnBackend } from "@/model/ai";
import {
  hasQuizSnapshotData,
  loadQuizSnapshotFromBackend,
  replaceQuizSnapshotOnBackend,
} from "@/model/quiz";
import { isTauriRuntime } from "@/lib/runtime";

/**
 * Hook that runs startup sync logic for Tauri environment.
 * Syncs AI configs and quiz snapshot between backend and local store.
 * Business-specific; co-located with Providers.
 */
export function useStartupSync() {
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
}
