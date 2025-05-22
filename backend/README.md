# AHF-QDS-EOE 后端

## 项目简介

题库练习应用后端，使用Go语言开发，提供用户管理、题库管理、题目管理、答题记录等功能的RESTful API。后端还提供AI接口代理，用于将前端的AI请求转发到对应的AI服务商。

## 技术栈

- Go 1.20
- Gin Web框架
- GORM ORM框架
- MySQL数据库
- JWT认证

## 项目结构

```
backend/
├── api/           # API控制器
│   └── v1/        # API v1版本
├── config/        # 配置
├── db/            # 数据库相关
├── middleware/    # 中间件
├── models/        # 数据模型
├── services/      # 业务逻辑服务
├── utils/         # 工具函数
├── data/          # 数据存储目录
├── .env.example   # 环境变量示例
├── main.go        # 程序入口
└── README.md      # 项目说明文档
```

## 功能模块

- **用户管理**：注册、登录、获取个人资料、更新个人资料、修改密码
- **题库管理**：创建题库、获取题库列表、获取题库详情、更新题库、删除题库
- **题目管理**：创建题目、获取题目列表、获取题目详情、更新题目、删除题目、批量导入题目
- **答题记录**：添加答题记录、获取答题记录、获取错题、清空答题记录、移除错题记录
- **AI代理**：DeepSeek API代理、阿里云通义千问API代理

## 环境要求

- Go 1.20或更高版本
- MySQL 8.0或更高版本

## 配置与启动

1. 复制环境变量示例文件并修改
   ```bash
   cp .env.example .env
   # 编辑.env文件，设置数据库连接等信息
   ```

2. 初始化数据库
   ```bash
   # 在MySQL中创建数据库
   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS \`ahf-qds-eoe\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
   ```

3. 构建并运行
   ```bash
   go build -o quiz-server
   ./quiz-server
   ```

4. 开发模式运行
   ```bash
   go run main.go
   ```

## API文档

启动服务后，可以通过以下端点访问API：

- 基础路径：`http://localhost:8080/api/v1`

### 用户相关API

- `POST /register` - 用户注册
- `POST /login` - 用户登录
- `GET /profile` - 获取个人资料（需要认证）
- `PUT /profile` - 更新个人资料（需要认证）
- `POST /change-password` - 修改密码（需要认证）

### 题库相关API

- `POST /banks` - 创建题库（需要认证）
- `GET /banks` - 获取题库列表（需要认证）
- `GET /banks/:id` - 获取题库详情（需要认证）
- `PUT /banks/:id` - 更新题库（需要认证）
- `DELETE /banks/:id` - 删除题库（需要认证）

### 题目相关API

- `POST /banks/:bankId/questions` - 创建题目（需要认证）
- `GET /banks/:bankId/questions` - 获取题库的题目列表（需要认证）
- `GET /questions/:id` - 获取题目详情（需要认证）
- `PUT /questions/:id` - 更新题目（需要认证）
- `DELETE /questions/:id` - 删除题目（需要认证）
- `POST /banks/:bankId/questions/import` - 批量导入题目（需要认证）

### 答题记录相关API

- `POST /records` - 添加答题记录（需要认证）
- `GET /records` - 获取答题记录（需要认证）
- `GET /records/wrong` - 获取错题（需要认证）
- `DELETE /records` - 清空答题记录（需要认证）
- `DELETE /records/:id/wrong` - 移除错题记录（需要认证）

### AI相关API

- `POST /ai/deepseek` - DeepSeek API代理
- `POST /ai/alibaba` - 阿里云通义千问API代理

## 许可证

MIT 