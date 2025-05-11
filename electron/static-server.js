/**
 * 静态文件服务器模块
 * 用于在Electron应用中提供HTML和静态资源服务
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');

/**
 * 创建静态文件服务器
 * @param {Object} options 服务器选项
 * @param {string} options.staticDir 静态文件目录路径
 * @param {string} options.publicDir 公共资源目录路径
 * @param {number} options.port 服务器端口
 * @param {Function} options.logFunc 日志函数
 * @returns {Promise<{server: Object, port: number}>} 返回服务器实例和端口
 */
function createStaticServer({staticDir, publicDir, port = 3000, logFunc = console.log}) {
  return new Promise((resolve, reject) => {
    try {
      // 检查静态目录是否存在
      const dirExists = doesDirectoryExist(staticDir);
      logFunc(`静态目录 ${staticDir} ${dirExists ? '存在' : '不存在'}`);
      
      if (!dirExists) {
        // 尝试查找其他可能的静态目录
        const alternativeDirs = findAlternativeStaticDirs();
        if (alternativeDirs.length === 0) {
          return reject(new Error(`静态目录不存在: ${staticDir}`));
        }
        
        // 使用找到的第一个目录
        staticDir = alternativeDirs[0];
        logFunc(`使用替代静态目录: ${staticDir}`);
      }

      // 检查公共资源目录是否存在
      const publicDirExists = publicDir && doesDirectoryExist(publicDir);
      logFunc(`公共资源目录 ${publicDir} ${publicDirExists ? '存在' : '不存在'}`);
      
      // 检查是否是Next.js导出的结构
      const isNextExport = fs.existsSync(path.join(staticDir, '_next'));
      logFunc(`Next.js导出结构: ${isNextExport ? '是' : '否'}`);
      
      // 创建Express应用
      const app = express();
      
      // 添加JSON解析中间件
      app.use(express.json());
      
      // 设置日志中间件
      app.use((req, res, next) => {
        logFunc(`收到请求: ${req.method} ${req.url}`);
        next();
      });

      // 处理公共资源目录
      if (publicDirExists) {
        // 检查logo目录
        const logoDir = path.join(publicDir, 'logo');
        if (doesDirectoryExist(logoDir)) {
          logFunc(`设置logo目录: ${logoDir}`);
          // 设置多个路径访问logo
          app.use('/logo', express.static(logoDir));
          app.use('/public/logo', express.static(logoDir));
          app.use('/app.asar.unpacked/public/logo', express.static(logoDir));
        }

        // 一般公共资源
        app.use('/public', express.static(publicDir));
      }
      
      if (isNextExport) {
        // 处理Next.js导出的静态文件
        setupNextExportRoutes(app, staticDir, logFunc);
      } else {
        // 普通静态文件服务
        setupStaticRoutes(app, staticDir, logFunc);
      }
      
      // 启动服务器
      const server = app.listen(port, () => {
        logFunc(`静态文件服务器在端口 ${port} 上启动成功`);
        resolve({server, port});
      });
      
      server.on('error', (err) => {
        logFunc(`静态文件服务器启动错误: ${err.message}`);
        reject(err);
      });
    } catch (err) {
      logFunc(`创建静态文件服务器时出错: ${err.message}`);
      reject(err);
    }
  });
}

/**
 * 设置Next.js导出的路由
 * @param {Object} app Express应用
 * @param {string} staticDir 静态文件目录
 * @param {Function} logFunc 日志函数
 */
function setupNextExportRoutes(app, staticDir, logFunc) {
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
      logFunc(`读取HTML文件失败: ${err.message}`);
      res.status(404).send(getFallbackHtml('页面未找到', filePath));
    }
  };
  
  // 处理API路由
  app.post('/api/ai/deepseek', async (req, res) => {
    try {
      logFunc('接收到 Deepseek API 请求');
      const { apiKey, baseUrl, messages } = req.body;
      
      if (!apiKey) {
        return res.status(400).json({ error: 'API 密钥不能为空' });
      }
      
      const apiBaseUrl = baseUrl || 'https://api.deepseek.com';
      
      // 转发请求到 Deepseek API
      const response = await fetch(`${apiBaseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return res.status(response.status).json({
          error: data.error?.message || `API请求失败，状态码: ${response.status}`
        });
      }
      
      return res.json(data);
    } catch (error) {
      logFunc(`Deepseek API 代理错误: ${error.message}`);
      return res.status(500).json({ error: error.message || '处理请求时发生未知错误' });
    }
  });
  
  app.post('/api/ai/alibaba', async (req, res) => {
    try {
      logFunc('接收到通义千问 API 请求');
      const { apiKey, messages } = req.body;
      
      if (!apiKey) {
        return res.status(400).json({ error: 'API 密钥不能为空' });
      }
      
      const ALIBABA_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
      const ALIBABA_MODEL = "qwen-turbo";
      
      // 转发请求到通义千问 API
      const response = await fetch(`${ALIBABA_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: ALIBABA_MODEL,
          messages
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return res.status(response.status).json({
          error: data.error?.message || `API请求失败，状态码: ${response.status}`
        });
      }
      
      return res.json(data);
    } catch (error) {
      logFunc(`通义千问 API 代理错误: ${error.message}`);
      return res.status(500).json({ error: error.message || '处理请求时发生未知错误' });
    }
  });
  
  // 处理主页请求
  app.get('/', (req, res) => {
    logFunc('接收到首页请求');
    serveHtml(path.join(staticDir, 'index.html'), res);
  });
  
  // 处理404页面
  app.get('/404', (req, res) => {
    serveHtml(path.join(staticDir, '404.html'), res);
  });
  
  // 处理动态路由页面
  app.get('/quiz/banks/:bankId', (req, res) => {
    logFunc(`接收到题库详情页请求: ${req.params.bankId}`);
    const bankHtmlPath = path.join(staticDir, 'quiz/banks', req.params.bankId + '.html');
    
    // 检查文件是否存在
    if (fs.existsSync(bankHtmlPath)) {
      serveHtml(bankHtmlPath, res);
    } else {
      // 尝试使用默认文件
      const defaultBankPath = path.join(staticDir, 'quiz/banks/default.html');
      if (fs.existsSync(defaultBankPath)) {
        logFunc(`使用默认题库页面: ${defaultBankPath}`);
        serveHtml(defaultBankPath, res);
      } else {
        // 找不到页面时展示备用HTML
        logFunc(`无法找到题库页面: ${bankHtmlPath}`);
        res.status(404).send(getFallbackHtml('题库页面未找到', req.path));
      }
    }
  });
  
  // 处理其他固定路由
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
      logFunc(`接收到路由请求: ${routePath}`);
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
            logFunc(`使用备用路径: ${fallbackPath}`);
            return serveHtml(fallbackPath, res);
          }
        }
        
        // 找不到页面时展示备用HTML
        logFunc(`无法找到路由页面: ${htmlPath}`);
        res.status(404).send(getFallbackHtml('页面未找到', req.path));
      }
    });
  });
  
  // 通用路由处理 - 尝试直接匹配HTML文件
  app.get('*', (req, res) => {
    logFunc(`尝试匹配未知路由: ${req.path}`);
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
    logFunc(`无法找到路由对应的页面: ${req.path}`);
    res.status(404).send(getFallbackHtml('页面未找到', req.path));
  });
}

/**
 * 设置普通静态文件路由
 * @param {Object} app Express应用
 * @param {string} staticDir 静态文件目录
 * @param {Function} logFunc 日志函数
 */
function setupStaticRoutes(app, staticDir, logFunc) {
  // 普通静态文件服务
  logFunc('使用一般静态文件服务');
  app.use(express.static(staticDir));
  
  // 通配符路由处理
  app.get('*', (req, res) => {
    logFunc(`处理通配符路由: ${req.path}`);
    
    // 检查SPA单页应用的索引页
    const indexPath = path.join(staticDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      logFunc(`返回SPA索引页: ${indexPath}`);
      return res.sendFile(indexPath);
    }
    
    // 找不到页面时展示备用HTML
    logFunc(`无法找到页面: ${req.path}`);
    res.status(404).send(getFallbackHtml('页面未找到', req.path));
  });
}

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

/**
 * 检查目录是否存在
 * @param {string} dirPath 目录路径
 * @returns {boolean} 目录是否存在
 */
function doesDirectoryExist(dirPath) {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch (err) {
    return false;
  }
}

/**
 * 查找替代的静态文件目录
 * @returns {string[]} 可用的静态目录列表
 */
function findAlternativeStaticDirs() {
  const { app } = require('electron');
  const possibleDirs = [
    path.join(process.resourcesPath, 'app.asar.unpacked', 'out'),
    path.join(process.resourcesPath, 'out'),
    path.join(__dirname, '..', 'out')
  ];
  
  return possibleDirs.filter(dir => doesDirectoryExist(dir));
}

module.exports = { createStaticServer }; 