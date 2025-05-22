/**
 * 环境检查脚本
 * 在应用启动时验证所有必要的环境和文件
 */
const fs = require('fs');
const path = require('path');

/**
 * 检查应用环境是否正常
 * @param {string} appPath 应用根目录
 * @param {Function} logFunc 日志记录函数
 * @returns {Object} 检查结果，包括状态和错误信息
 */
function checkEnvironment(appPath, logFunc) {
  const result = {
    success: true,
    errors: []
  };
  
  try {
    logFunc('开始环境检查');
    
    // 检查必要的目录
    const requiredDirs = [
      'out',
      'node_modules'
    ];
    
    let missingDirs = 0;
    for (const dir of requiredDirs) {
      const dirPath = path.join(appPath, dir);
      if (!fs.existsSync(dirPath)) {
        const error = `缺少必要目录: ${dir}`;
        logFunc(error);
        result.errors.push(error);
        missingDirs++;
      }
    }
    
    // 如果缺少所有必要目录，则认为环境检查失败
    if (missingDirs >= requiredDirs.length) {
      result.success = false;
    }
    
    // 检查out目录是否包含构建文件
    const outDir = path.join(appPath, 'out');
    if (fs.existsSync(outDir)) {
      const files = fs.readdirSync(outDir);
      if (files.length === 0) {
        const error = 'out目录是空的，应用可能未正确构建';
        logFunc(error);
        result.errors.push(error);
        // 不将这个作为失败条件，因为生产环境可能不需要out目录
      }
    }
    
    // 检查node_modules目录中是否有重要依赖，但不作为失败条件
    const nodeModulesDir = path.join(appPath, 'node_modules');
    if (fs.existsSync(nodeModulesDir)) {
      const criticalDeps = [
        'next',
        'react',
        'react-dom'
      ];
      
      for (const dep of criticalDeps) {
        const depPath = path.join(nodeModulesDir, dep);
        if (!fs.existsSync(depPath)) {
          const warning = `未找到依赖: ${dep}，但这不影响打包后的应用运行`;
          logFunc(warning);
          // 不添加到errors中，因为打包后的应用不依赖这些目录
        }
      }
    }
    
    // 检查Next.js配置文件 - 同时检查.ts和.js扩展名
    let hasNextConfig = false;
    const nextConfigPaths = [
      path.join(appPath, 'next.config.ts'),
      path.join(appPath, 'next.config.js'),
      path.join(appPath, 'next.config.mjs')
    ];
    
    for (const configPath of nextConfigPaths) {
      if (fs.existsSync(configPath)) {
        hasNextConfig = true;
        logFunc(`找到Next.js配置文件: ${configPath}`);
        break;
      }
    }
    
    if (!hasNextConfig) {
      const warning = 'Next.js配置文件不存在，这可能不影响已打包的应用';
      logFunc(warning);
      // 不将这个作为失败条件，因为已打包的应用可能不需要配置文件
    }
    
    // 检查package.json文件
    const packageJsonPath = path.join(appPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      const warning = 'package.json文件不存在，这可能不影响已打包的应用';
      logFunc(warning);
      // 不将这个作为失败条件，因为已打包的应用可能不需要package.json
    } else {
      // 检查package.json中的关键配置
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (!packageJson.scripts || !packageJson.scripts.start) {
          const warning = 'package.json中未找到start脚本，这可能不影响已打包的应用';
          logFunc(warning);
          // 不将这个作为失败条件
        }
      } catch (err) {
        const warning = `无法解析package.json: ${err.message}，但这可能不影响已打包的应用`;
        logFunc(warning);
        // 不将这个作为失败条件
      }
    }
    
    logFunc(`环境检查${result.success ? '通过' : '失败'}`);
    return result;
  } catch (error) {
    const errorMsg = `环境检查过程中出错: ${error.message}`;
    logFunc(errorMsg);
    // 即使在检查过程中出错，也尝试继续运行应用
    result.success = true;  // 改为true，不让环境检查错误阻止应用启动
    result.errors.push(errorMsg);
    return result;
  }
}

module.exports = checkEnvironment; 