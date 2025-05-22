package main

import (
	"fmt"
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	v1 "github.com/kurodakayn/ahf-qds-eoe/api/v1"
	"github.com/kurodakayn/ahf-qds-eoe/config"
)

func main() {
	// 加载配置
	if err := config.LoadConfig(); err != nil {
		log.Fatalf("加载配置失败: %v", err)
	}

	// 初始化数据库连接
	if err := config.InitDB(); err != nil {
		log.Fatalf("初始化数据库失败: %v", err)
	}

	// 创建Gin引擎
	r := gin.Default()

	// 设置CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// API版本路由组
	apiV1 := r.Group("/api/v1")

	// 注册控制器路由
	userController := v1.NewUserController()
	userController.RegisterRoutes(apiV1)

	bankController := v1.NewQuestionBankController()
	bankController.RegisterRoutes(apiV1)

	questionController := v1.NewQuestionController()
	questionController.RegisterRoutes(apiV1)

	recordController := v1.NewQuestionRecordController()
	recordController.RegisterRoutes(apiV1)

	aiController := v1.NewAIController()
	aiController.RegisterRoutes(apiV1)

	// 设置服务器地址
	addr := fmt.Sprintf(":%d", config.AppConfig.Port)
	log.Printf("服务器启动在 http://localhost%s", addr)

	// 启动服务器
	if err := r.Run(addr); err != nil {
		log.Fatalf("服务器启动失败: %v", err)
	}
} 