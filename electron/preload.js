// 引入Electron相关模块
const { contextBridge, ipcRenderer } = require('electron');

/**
 * 暴露安全的API给渲染进程
 * 这里我们创建一个可以在渲染进程中访问的安全桥梁
 */
contextBridge.exposeInMainWorld('electron', {
  // 发送消息到主进程
  sendMessage: (channel, data) => {
    // 限制只有特定通道能被使用
    const validChannels = [
      'message-from-renderer', 
      'get-log-path',
      'restart-app'
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  // 接收来自主进程的消息
  receiveMessage: (channel, func) => {
    const validChannels = [
      'message-from-main', 
      'log-path-response'
    ];
    if (validChannels.includes(channel)) {
      // 删除旧的监听器，避免堆积
      ipcRenderer.removeAllListeners(channel);
      // 添加新的监听器
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  // 获取应用版本信息
  getVersionInfo: () => {
    return {
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node
    };
  }
}); 