import { useEffect, useState } from 'react';

/**
 * 判断当前环境是否为Electron
 * @returns {boolean} 是否在Electron环境中运行
 */
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && 'electron' in window;
};

/**
 * 提供在React组件中使用Electron功能的钩子
 * @returns 包含Electron API和环境信息的对象
 */
export const useElectron = () => {
  const [isElectronEnv, setIsElectronEnv] = useState<boolean>(false);

  useEffect(() => {
    // 在组件挂载时检查是否在Electron环境
    setIsElectronEnv(isElectron());
  }, []);

  /**
   * 安全地发送消息到主进程
   * @param channel 通信通道名称
   * @param data 要发送的数据
   */
  const sendMessage = (channel: string, data: any) => {
    if (isElectronEnv) {
      (window as any).electron.sendMessage(channel, data);
    }
  };

  /**
   * 安全地接收来自主进程的消息
   * @param channel 通信通道名称
   * @param callback 处理接收到消息的回调函数
   */
  const receiveMessage = (channel: string, callback: (...args: any[]) => void) => {
    if (isElectronEnv) {
      (window as any).electron.receiveMessage(channel, callback);
    }
  };

  return {
    isElectronEnv,
    sendMessage,
    receiveMessage,
  };
}; 