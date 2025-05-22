// 引入Electron相关模块
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const portfinder = require('portfinder');
const fs = require('fs');
const checkEnvironment = require('./check-environment');
const http = require('http');
const express = require('express');
const { createStaticServer } = require('./static-server');

// 创建日志目录和文件
const userDataPath = app.getPath('userData');
const logPath = path.join(userDataPath, 'logs');
if (!fs.existsSync(logPath)) {
  fs.mkdirSync(logPath, { recursive: true });
}
const logFile = path.join(logPath, 'app.log');

/**
 * 记录日志到文件
 * @param {string} message 日志消息
 */
function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;
  
  // 同步写入日志，确保在应用崩溃时也能记录
  try {
    fs.appendFileSync(logFile, logMessage);
  } catch (err) {
    console.error('无法写入日志文件:', err);
  }
  
  // 同时输出到控制台
  console.log(message);
}

// 设置全局错误处理
process.on('uncaughtException', (error) => {
  logToFile(`未捕获的异常: ${error.toString()}`);
  logToFile(error.stack);
  
  dialog.showErrorBox('应用错误', 
    `应用发生了错误，请查看日志文件：${logFile}\n\n错误信息: ${error.message}`);
});

// 开发环境变量
const isDev = process.env.NODE_ENV === 'development';
// Next.js服务进程
let nextProcess = null;
// 存储Next.js服务端口
let nextPort = 3000;
// Express服务器（备用方案）
let fallbackServer = null;

/**
 * 获取应用根目录
 * 适用于开发环境和打包后的环境
 * @returns {string} 应用根目录路径
 */
function getAppRoot() {
  // 检查是否在打包环境中运行
  const isPackaged = app.isPackaged;
  
  if (isPackaged) {
    // 打包环境 - 应用位于 app.asar 中
    // 为了调试，记录可能的路径
    const possiblePaths = [
      path.join(process.resourcesPath, 'app.asar'),
      path.join(process.resourcesPath, 'app'),
      path.join(__dirname, '..')
    ];
    
    // Windows可能有不同的路径
    if (process.platform === 'win32') {
      possiblePaths.push(
        path.join(process.resourcesPath, 'app.asar.unpacked'),
        path.join(process.cwd(), 'resources', 'app.asar')
      );
    }
    
    for (const tryPath of possiblePaths) {
      logToFile(`检查可能的应用根目录: ${tryPath}`);
      if (fs.existsSync(tryPath)) {
        logToFile(`使用应用根目录: ${tryPath}`);
        return tryPath;
      }
    }
    
    // 默认返回
    return path.join(process.resourcesPath, 'app.asar');
  } else {
    // 开发环境 - 直接使用项目目录
    return path.join(__dirname, '..');
  }
}

/**
 * 获取导出目录路径
 * @returns {string} 导出目录路径
 */
function getExportDir() {
  const appRoot = getAppRoot();
  const possibleOutDirs = [
    path.join(appRoot, 'out'),
    path.join(process.resourcesPath, 'app.asar.unpacked', 'out'),
    path.join(process.resourcesPath, 'out'),
    path.dirname(appRoot) === 'app.asar' ? path.join(path.dirname(appRoot), 'app.asar.unpacked', 'out') : null,
    app.isPackaged ? path.join(process.resourcesPath, 'app', 'out') : null
  ].filter(Boolean);
  
  // 记录所有可能的路径
  logToFile(`可能的导出目录路径:`);
  possibleOutDirs.forEach(dir => logToFile(`- ${dir}`));
  
  for (const outDir of possibleOutDirs) {
    logToFile(`检查导出目录: ${outDir}`);
    try {
      if (fs.existsSync(outDir)) {
        logToFile(`找到有效的导出目录: ${outDir}`);
        // 列出目录内容以便调试
        try {
          const files = fs.readdirSync(outDir);
          logToFile(`目录内容: ${files.join(', ')}`);
          
          // 检查是否有quiz.html文件
          if (files.includes('quiz.html')) {
            logToFile(`找到quiz.html文件`);
          } else {
            logToFile(`警告: 未找到quiz.html文件`);
            
            // 检查更深的目录结构
            if (files.includes('quiz')) {
              const quizDirPath = path.join(outDir, 'quiz');
              if (fs.existsSync(quizDirPath) && fs.statSync(quizDirPath).isDirectory()) {
                logToFile(`找到quiz目录`);
                const quizFiles = fs.readdirSync(quizDirPath);
                logToFile(`quiz目录内容: ${quizFiles.join(', ')}`);
              }
            }
          }
        } catch (e) {
          logToFile(`列出目录内容时出错: ${e.message}`);
        }
        
        return outDir;
      }
    } catch (err) {
      logToFile(`检查目录时出错: ${outDir}, 错误: ${err.message}`);
    }
  }
  
  // 默认路径
  const defaultDir = path.join(appRoot, 'out');
  logToFile(`未找到导出目录，使用默认路径: ${defaultDir}`);
  return defaultDir;
}

/**
 * 获取公共资源目录路径
 * @returns {string} 公共资源目录路径
 */
function getPublicDir() {
  const appRoot = getAppRoot();
  const possiblePublicDirs = [
    path.join(appRoot, 'public'),
    path.join(process.resourcesPath, 'app.asar.unpacked', 'public'),
    path.join(process.resourcesPath, 'public'),
    path.join(path.dirname(appRoot), 'app.asar.unpacked', 'public'),
  ].filter(Boolean);
  
  logToFile(`查找公共资源目录...`);
  
  for (const publicDir of possiblePublicDirs) {
    try {
      if (fs.existsSync(publicDir)) {
        logToFile(`找到公共资源目录: ${publicDir}`);
        
        // 检查logo文件是否存在
        const logoDir = path.join(publicDir, 'logo');
        if (fs.existsSync(logoDir)) {
          logToFile(`找到logo目录: ${logoDir}`);
          try {
            const logoFiles = fs.readdirSync(logoDir);
            logToFile(`logo目录内容: ${logoFiles.join(', ')}`);
          } catch (e) {
            logToFile(`列出logo目录内容时出错: ${e.message}`);
          }
        } else {
          logToFile(`警告: 未找到logo目录: ${logoDir}`);
        }
        
        return publicDir;
      }
    } catch (err) {
      logToFile(`检查公共资源目录时出错: ${publicDir}, 错误: ${err.message}`);
    }
  }
  
  const defaultDir = path.join(appRoot, 'public');
  logToFile(`未找到公共资源目录，使用默认路径: ${defaultDir}`);
  return defaultDir;
}

/**
 * 启动应用服务器
 * 优先使用静态服务器，失败时尝试Next.js服务
 * @returns {Promise<number>} 返回服务器端口
 */
async function startAppServer() {
  // 导出目录路径
  const exportDir = getExportDir();
  // 公共资源目录路径
  const publicDir = getPublicDir();
  
  logToFile('正在启动应用服务器...');
  logToFile(`使用导出目录: ${exportDir}`);
  logToFile(`使用公共资源目录: ${publicDir}`);
  
  // 查找可用端口
  const port = await portfinder.getPortPromise({
    port: 3000, // 起始端口
  });
  
  // 尝试启动静态服务器
  try {
    logToFile('尝试启动静态服务器...');
    
    const staticServerResult = await createStaticServer({
      staticDir: exportDir,
      publicDir: publicDir,
      port: port,
      logFunc: logToFile
    });
    
    logToFile(`静态服务器启动成功，端口: ${staticServerResult.port}`);
    fallbackServer = staticServerResult.server;
    return staticServerResult.port;
  } catch (staticError) {
    logToFile(`静态服务器启动失败: ${staticError.message}`);
    logToFile('尝试启动Next.js服务器...');
    
    // 如果静态服务器失败，尝试启动Next.js服务
    try {
      return await startNextServer();
    } catch (nextError) {
      logToFile(`Next.js服务器启动失败: ${nextError.message}`);
      // 尝试启动备用服务器
      try {
        return await startFallbackServer();
      } catch (fallbackError) {
        throw new Error(`所有服务器启动方式都失败: ${fallbackError.message}`);
      }
    }
  }
}

/**
 * 启动备用的静态文件服务器
 * @returns {Promise<number>} 返回服务器端口
 */
async function startFallbackServer() {
  logToFile('正在启动备用静态文件服务器...');

  try {
    // 查找可用端口
    nextPort = await portfinder.getPortPromise({
      port: 3000, // 起始端口
    });
    
    logToFile(`使用端口 ${nextPort} 启动备用服务器`);
    
    return new Promise((resolve, reject) => {
      try {
        const app = express();
        
        // 静态文件服务 - 尝试多个可能的位置
        const possibleOutPaths = [
          getExportDir(),
          path.join(getAppRoot(), 'out'),
          path.join(getAppRoot(), '.next'),
          path.join(getAppRoot(), 'dist'),
          path.join(process.resourcesPath, 'app.asar.unpacked', 'out'),
          path.join(process.resourcesPath, 'out'),
          path.join(__dirname, '..', 'out'),
          path.join(__dirname, '..'),
        ];
        
        let foundStaticDir = false;
        let staticDir = '';
        for (const outPath of possibleOutPaths) {
          logToFile(`检查静态文件目录: ${outPath}`);
          if (fs.existsSync(outPath)) {
            logToFile(`找到静态文件目录: ${outPath}`);
            staticDir = outPath;
            foundStaticDir = true;
            break;
          }
        }
        
        if (foundStaticDir) {
          // 检查是否是Next.js导出的结构
          if (fs.existsSync(path.join(staticDir, '_next'))) {
            logToFile('检测到Next.js导出结构，使用特殊配置');
            
            // 静态文件服务
            app.use('/_next', express.static(path.join(staticDir, '_next')));
            app.use('/images', express.static(path.join(staticDir, 'images')));
            app.use('/assets', express.static(path.join(staticDir, 'assets')));
            
            // 读取html文件的帮助函数
            const serveHtml = (filePath, res) => {
              try {
                if (fs.existsSync(filePath)) {
                  const html = fs.readFileSync(filePath, 'utf8');
                  res.send(html);
                } else {
                  throw new Error(`文件不存在: ${filePath}`);
                }
              } catch (err) {
                logToFile(`读取HTML文件失败: ${err.message}`);
                res.status(404).send('页面未找到');
              }
            };
            
            // 处理主页请求
            app.get('/', (req, res) => {
              logToFile('接收到首页请求');
              serveHtml(path.join(staticDir, 'index.html'), res);
            });
            
            // 处理404页面
            app.get('/404', (req, res) => {
              serveHtml(path.join(staticDir, '404.html'), res);
            });
            
            // 处理动态路由页面
            app.get('/quiz/banks/:bankId', (req, res) => {
              logToFile(`接收到题库详情页请求: ${req.params.bankId}`);
              const bankHtmlPath = path.join(staticDir, 'quiz/banks', req.params.bankId + '.html');
              
              // 检查文件是否存在
              if (fs.existsSync(bankHtmlPath)) {
                serveHtml(bankHtmlPath, res);
              } else {
                // 尝试使用默认文件
                const defaultBankPath = path.join(staticDir, 'quiz/banks/default.html');
                if (fs.existsSync(defaultBankPath)) {
                  logToFile(`使用默认题库页面: ${defaultBankPath}`);
                  serveHtml(defaultBankPath, res);
                } else {
                  // 找不到页面时展示备用HTML
                  logToFile(`无法找到题库页面: ${bankHtmlPath}`);
                  res.status(404).send(getFallbackHtml('题库页面未找到', req.path));
                }
              }
            });
            
            // 处理其他路由
            const routePaths = [
              '/quiz',
              '/quiz/convert',
              '/quiz/import-export',
              '/quiz/practice',
              '/quiz/review',
              '/quiz/review/practice',
              '/quiz/settings'
            ];
            
            routePaths.forEach(routePath => {
              app.get(routePath, (req, res) => {
                logToFile(`接收到路由请求: ${routePath}`);
                const htmlPath = path.join(staticDir, routePath.substring(1) + '.html');
                
                if (fs.existsSync(htmlPath)) {
                  serveHtml(htmlPath, res);
                } else {
                  // 尝试使用备用路径
                  const fallbacks = [
                    path.join(staticDir, routePath.substring(1), 'index.html'),
                    path.join(staticDir, 'index.html')
                  ];
                  
                  for (const fallbackPath of fallbacks) {
                    if (fs.existsSync(fallbackPath)) {
                      logToFile(`使用备用路径: ${fallbackPath}`);
                      return serveHtml(fallbackPath, res);
                    }
                  }
                  
                  // 找不到页面时展示备用HTML
                  logToFile(`无法找到路由页面: ${htmlPath}`);
                  res.status(404).send(getFallbackHtml('页面未找到', req.path));
                }
              });
            });
            
            // 通用路由处理 - 尝试直接匹配HTML文件
            app.get('*', (req, res) => {
              logToFile(`尝试匹配未知路由: ${req.path}`);
              const htmlPath = path.join(staticDir, req.path.substring(1));
              
              // 尝试多种可能的路径
              const possiblePaths = [
                htmlPath,
                htmlPath + '.html',
                path.join(htmlPath, 'index.html'),
              ];
              
              for (const tryPath of possiblePaths) {
                if (fs.existsSync(tryPath)) {
                  return serveHtml(tryPath, res);
                }
              }
              
              // 找不到页面时展示备用HTML页面
              logToFile(`无法找到路由对应的页面: ${req.path}`);
              const fallbackHtml = `
                <!DOCTYPE html>
                <html lang="zh">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>页面未找到</title>
                  <style>
                    body {
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      height: 100vh;
                      margin: 0;
                      background-color: #f5f5f5;
                      color: #333;
                      text-align: center;
                    }
                    .container {
                      max-width: 600px;
                      padding: 40px;
                      background: white;
                      border-radius: 8px;
                      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    }
                    h1 { color: #3182ce; }
                    .btn {
                      background: #3182ce;
                      color: white;
                      border: none;
                      padding: 8px 16px;
                      border-radius: 4px;
                      cursor: pointer;
                      margin-top: 20px;
                      font-size: 16px;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>页面未找到</h1>
                    <p>无法找到请求的页面。</p>
                    <p>请求路径: ${req.path}</p>
                    <button class="btn" onclick="window.location.href='/'">返回首页</button>
                  </div>
                </body>
                </html>
              `;
              res.status(404).send(fallbackHtml);
            });
          } else {
            // 普通静态文件服务
            logToFile('使用一般静态文件服务');
            app.use(express.static(staticDir));
          }
        } else {
          logToFile('未找到静态文件目录，使用备用HTML');
          // 如果没有找到静态文件目录，返回备用HTML
          app.get('*', (req, res) => {
            const fallbackHtml = `
              <!DOCTYPE html>
              <html lang="zh">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>应用加载失败</title>
                <style>
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    background-color: #f5f5f5;
                    color: #333;
                    text-align: center;
                  }
                  .container {
                    max-width: 600px;
                    padding: 40px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                  }
                  h1 { color: #e53e3e; }
                  .btn {
                    background: #3182ce;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 20px;
                    font-size: 16px;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>应用加载失败</h1>
                  <p>无法加载应用内容，请查看日志了解更多信息。</p>
                  <p>日志位置: ${logFile}</p>
                  <p>请求路径: ${req.path}</p>
                  <button class="btn" onclick="window.location.reload()">重试</button>
                </div>
              </body>
              </html>
            `;
            res.send(fallbackHtml);
          });
        }
        
        // 启动服务器
        fallbackServer = app.listen(nextPort, () => {
          logToFile(`备用服务器在端口 ${nextPort} 上启动成功`);
          resolve(nextPort);
        });
        
        fallbackServer.on('error', (err) => {
          logToFile(`备用服务器启动错误: ${err.message}`);
          reject(err);
        });
      } catch (err) {
        logToFile(`创建备用服务器时出错: ${err.message}`);
        reject(err);
      }
    });
  } catch (error) {
    logToFile(`启动备用服务器错误: ${error.message}`);
    throw error;
  }
}

/**
 * 启动Next.js服务器
 * @returns {Promise<number>} 返回服务器端口
 */
async function startNextServer() {
  try {
    logToFile('正在启动Next.js服务器...');
    
    // 查找可用端口
    nextPort = await portfinder.getPortPromise({
      port: 3000, // 起始端口
    });
    
    logToFile(`使用端口 ${nextPort} 启动Next.js服务器`);

    return new Promise((resolve, reject) => {
      // 检查out目录是否存在
      const outDir = getExportDir();
      if (!fs.existsSync(outDir)) {
        logToFile(`警告: out目录不存在: ${outDir}，尝试继续`);
      }
      
      // 获取应用根目录
      const appRoot = getAppRoot();
      logToFile(`使用应用根目录启动Next.js: ${appRoot}`);
      
      // 根据平台选择正确的命令
      let command = 'npx';
      let args = ['next', 'start', '-p', nextPort.toString()];
      const options = {
        cwd: appRoot,
        shell: true,
        env: { ...process.env, PORT: nextPort.toString() },
      };

      // 在Windows上使用不同的命令方式
      if (process.platform === 'win32') {
        // Windows可能需要使用不同的方式调用npx
        logToFile('检测到Windows系统，调整命令');
        command = process.platform === 'win32' ? 'cmd' : command;
        args = process.platform === 'win32' ? ['/c', `npx next start -p ${nextPort}`] : args;
      }
      
      // 尝试启动next服务
      try {
        logToFile(`执行命令: ${command} ${args.join(' ')}`);
        nextProcess = spawn(command, args, options);

        // 监听输出
        nextProcess.stdout.on('data', (data) => {
          const output = data.toString();
          logToFile(`Next.js输出: ${output}`);
          // 当看到服务启动成功的消息时，解析promise
          if (output.includes('Ready in')) {
            resolve(nextPort);
          }
        });

        nextProcess.stderr.on('data', (data) => {
          const errorOutput = data.toString();
          logToFile(`Next.js错误: ${errorOutput}`);
          // 检查是否是致命错误
          if (errorOutput.includes('ENOENT') || errorOutput.includes('Error:')) {
            reject(new Error(`Next.js服务器启动错误: ${errorOutput}`));
          }
        });

        nextProcess.on('error', (err) => {
          logToFile(`无法启动Next.js服务器: ${err.message}`);
          reject(err);
        });
        
        nextProcess.on('exit', (code) => {
          if (code !== 0) {
            logToFile(`Next.js进程异常退出，退出码: ${code}`);
            reject(new Error(`Next.js进程异常退出，退出码: ${code}`));
          }
        });

        // 设置超时
        setTimeout(() => {
          reject(new Error('启动Next.js服务器超时'));
        }, 30000);
      } catch (error) {
        logToFile(`启动Next.js进程失败: ${error.message}`);
        reject(error);
      }
    });
  } catch (error) {
    logToFile(`启动Next.js服务器错误: ${error.message}`);
    throw error;
  }
}

/**
 * 创建主窗口
 * @returns {BrowserWindow} 返回创建的主窗口实例
 */
function createWindow() {
  logToFile('创建主窗口');
  
  // 创建浏览器窗口
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  return mainWindow;
}

// 当Electron完成初始化后创建窗口
app.whenReady().then(async () => {
  logToFile('应用准备就绪');
  
  try {
    // 进行环境检查
    const appPath = path.join(__dirname, '..');
    const envCheckResult = checkEnvironment(appPath, logToFile);
    
    if (!envCheckResult.success) {
      const errorMessage = `环境检查失败：\n${envCheckResult.errors.join('\n')}`;
      logToFile(errorMessage);
      
      // 显示错误对话框
      dialog.showErrorBox('启动检查失败', 
        `应用环境检查失败，无法正常启动。\n\n${errorMessage}\n\n请检查日志文件: ${logFile}`);
      
      app.quit();
      return;
    }
    
    const mainWindow = createWindow();

    if (isDev) {
      logToFile('使用开发模式');
      // 开发环境加载本地服务
      await mainWindow.loadURL('http://localhost:3000');
      // 打开开发者工具
      mainWindow.webContents.openDevTools();
    } else {
      try {
        logToFile('使用生产模式');
        // 尝试启动应用服务器
        const port = await startAppServer();
        logToFile(`应用服务器启动成功，端口: ${port}`);
        
        // 加载应用
        logToFile(`正在加载应用: http://localhost:${port}`);
        await mainWindow.loadURL(`http://localhost:${port}`);
        logToFile('应用加载成功');
      } catch (error) {
        logToFile(`加载应用失败: ${error.message}`);
        
        // 尝试加载备用错误页面而不是立即退出
        try {
          logToFile('尝试加载备用错误页面');
          const fallbackPath = path.join(__dirname, 'fallback.html');
          
          if (fs.existsSync(fallbackPath)) {
            await mainWindow.loadFile(fallbackPath);
            logToFile('备用错误页面加载成功');
          } else {
            logToFile(`备用错误页面不存在: ${fallbackPath}，使用内联HTML`);
            await mainWindow.loadURL(`data:text/html;charset=utf-8,
              <html>
                <head>
                  <meta charset="UTF-8">
                  <title>加载错误</title>
                  <style>
                    body { 
                      font-family: sans-serif; 
                      padding: 40px; 
                      text-align: center;
                      background: #f5f5f5;
                    }
                    h1 { color: #e53e3e; }
                    .container {
                      max-width: 600px;
                      margin: 0 auto;
                      background: white;
                      padding: 20px;
                      border-radius: 8px;
                      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>应用加载失败</h1>
                    <p>无法启动应用服务器。请查看日志文件了解更多信息。</p>
                    <pre>${logFile}</pre>
                    <p>错误信息: ${error.message}</p>
                    <button onclick="window.location.reload()">重试</button>
                  </div>
                </body>
              </html>
            `);
            logToFile('内联错误页面加载成功');
          }
        } catch (fallbackError) {
          logToFile(`加载备用错误页面失败: ${fallbackError.message}`);
          dialog.showErrorBox('加载失败', 
            `无法启动应用服务器。请检查日志文件: ${logFile}\n\n错误信息: ${error.message}`);
          app.quit();
        }
      }
    }

    // 在macOS上，当所有窗口都关闭时，通常会重新创建一个窗口
    app.on('activate', () => {
      logToFile('activate事件触发');
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    logToFile(`应用启动错误: ${error.message}`);
    dialog.showErrorBox('启动错误', `应用启动失败: ${error.message}`);
    app.quit();
  }
});

// 在所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  logToFile('所有窗口已关闭');
  if (process.platform !== 'darwin') {
    logToFile('正在退出应用');
    app.quit();
  }
});

// 在应用退出前关闭所有服务器
app.on('before-quit', () => {
  logToFile('应用准备退出');
  if (nextProcess !== null) {
    logToFile('正在关闭Next.js服务器');
    nextProcess.kill();
    nextProcess = null;
  }
  if (fallbackServer !== null) {
    logToFile('正在关闭备用服务器');
    fallbackServer.close();
    fallbackServer = null;
  }
});

// 处理应用程序的IPC通信
ipcMain.on('message-from-renderer', (event, arg) => {
  logToFile(`从渲染进程收到消息: ${arg}`);
  // 回复渲染进程
  event.reply('message-from-main', 'Message received by main process');
});

// 处理获取日志路径请求
ipcMain.on('get-log-path', (event) => {
  logToFile('收到获取日志路径请求');
  event.reply('log-path-response', logFile);
});

// 处理重启应用请求
ipcMain.on('restart-app', () => {
  logToFile('收到重启应用请求');
  app.relaunch();
  app.exit();
});

/**
 * 生成备用HTML页面
 * @param {string} title 错误标题
 * @param {string} path 请求路径
 * @returns {string} HTML页面内容
 */
function getFallbackHtml(title, path) {
  return `
    <!DOCTYPE html>
    <html lang="zh">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          background-color: #f5f5f5;
          color: #333;
          text-align: center;
        }
        .container {
          max-width: 600px;
          padding: 40px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        h1 { color: #3182ce; }
        .btn {
          background: #3182ce;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 20px;
          font-size: 16px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${title}</h1>
        <p>无法找到请求的页面。</p>
        <p>请求路径: ${path}</p>
        <button class="btn" onclick="window.location.href='/'">返回首页</button>
      </div>
    </body>
    </html>
  `;
} 