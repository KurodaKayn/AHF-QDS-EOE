import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";

/**
 * 判断当前环境是否为Tauri
 * @returns {boolean} 是否在Tauri环境中运行
 */
export const isTauri = (): boolean => {
  return typeof window !== "undefined" && "__TAURI__" in window;
};

/**
 * 提供在React组件中使用Tauri功能的钩子
 * @returns 包含Tauri API和环境信息的对象
 */
export const useTauri = () => {
  const [isTauriEnv, setIsTauriEnv] = useState<boolean>(false);

  useEffect(() => {
    // 在组件挂载时检查是否在Tauri环境
    setIsTauriEnv(isTauri());
  }, []);

  /**
   * 安全地调用Tauri命令
   * @param command 命令名称
   * @param args 命令参数
   */
  const invokeCommand = async <T = unknown>(
    command: string,
    args?: Record<string, unknown>
  ): Promise<T | null> => {
    if (isTauriEnv) {
      try {
        return await invoke<T>(command, args);
      } catch (error) {
        toast.error(`调用 Tauri 命令 ${command} 失败`);
        return null;
      }
    }
    return null;
  };

  /**
   * 发送消息到后端（兼容原Electron API）
   * @param channel 通信通道名称
   * @param data 要发送的数据
   */
  const sendMessage = async (channel: string, data: unknown) => {
    return await invokeCommand("handle_message", {
      message: JSON.stringify({ channel, data }),
    });
  };

  /**
   * 获取日志路径
   */
  const getLogPath = async (): Promise<string | null> => {
    return await invokeCommand<string>("get_log_path");
  };

  /**
   * 重启应用
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
