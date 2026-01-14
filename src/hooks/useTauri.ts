import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import i18n from "@/i18n/config";

/**
 * Check if the current environment is Tauri
 * @returns {boolean} Whether running in Tauri environment
 */
export const isTauri = (): boolean => {
  return typeof window !== "undefined" && "__TAURI__" in window;
};

/**
 * Hook to use Tauri functionality in React components
 * @returns Object containing Tauri API and environment information
 */
export const useTauri = () => {
  const [isTauriEnv, setIsTauriEnv] = useState<boolean>(false);

  useEffect(() => {
    // Check for Tauri environment on mount
    setIsTauriEnv(isTauri());
  }, []);

  /**
   * Safely invoke a Tauri command
   * @param command Command name
   * @param args Command arguments
   */
  const invokeCommand = async <T = unknown>(
    command: string,
    args?: Record<string, unknown>
  ): Promise<T | null> => {
    if (isTauriEnv) {
      try {
        return await invoke<T>(command, args);
      } catch (error) {
        toast.error(i18n.t("common.tauriError", { command }));
        return null;
      }
    }
    return null;
  };

  /**
   * Send a message to the backend
   * @param channel IPC channel name
   * @param data Data to send
   */
  const sendMessage = async (channel: string, data: unknown) => {
    return await invokeCommand("handle_message", {
      message: JSON.stringify({ channel, data }),
    });
  };

  /**
   * Get the application log path
   */
  const getLogPath = async (): Promise<string | null> => {
    return await invokeCommand<string>("get_log_path");
  };

  /**
   * Restart the application
   */
  const restartApp = async (): Promise<void> => {
    await invokeCommand("restart_app");
  };

  return {
    isTauriEnv,
    invokeCommand,
    sendMessage,
    getLogPath,
    restartApp,
  };
};
