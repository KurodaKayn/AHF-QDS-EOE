package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config 全局配置结构体
type Config struct {
	Port      int
	JWTSecret string
	Env       string
}

var AppConfig Config

// LoadConfig 从.env文件加载配置
func LoadConfig() error {
	// 加载.env文件
	err := godotenv.Load()
	if err != nil {
		return err
	}

	// 解析端口
	port, err := strconv.Atoi(os.Getenv("PORT"))
	if err != nil {
		port = 8080 // 默认端口
	}

	// 填充配置
	AppConfig = Config{
		Port:      port,
		JWTSecret: os.Getenv("JWT_SECRET"),
		Env:       os.Getenv("ENV"),
	}

	return nil
}

// GetConfig 获取应用配置
func GetConfig() Config {
	return AppConfig
} 