/**
 * Electron API 类型声明
 * 为Electron在渲染进程中提供的API定义接口
 */
interface ElectronAPI {
  /**
   * 发送消息到主进程
   * @param channel 通信通道名称
   * @param data 要发送的数据
   */
  sendMessage: (channel: string, data: any) => void;

  /**
   * 接收来自主进程的消息
   * @param channel 通信通道名称
   * @param func 处理接收到消息的回调函数
   */
  receiveMessage: (channel: string, func: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    /**
     * 通过preload脚本暴露的Electron API
     */
    electron: ElectronAPI;
  }
} 