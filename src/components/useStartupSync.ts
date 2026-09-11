import { useEffect } from "react";
import { useQuizStore, quizApi } from "@/model/quiz";
import { aiApi } from "@/model/ai";
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
      await aiApi.saveConfigs(store.settings.aiConfigs);
      if (cancelled) return;

      // 2. Sync Quiz snapshot between backend and local state
      const currentStore = useQuizStore.getState();
      const localSnapshot = {
        questionBanks: currentStore.questionBanks,
        records: currentStore.records,
      };

      const remoteSnapshot = await quizApi.syncSnapshot(localSnapshot);
      if (remoteSnapshot && !cancelled) {
        currentStore.replaceQuizData(remoteSnapshot);
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
