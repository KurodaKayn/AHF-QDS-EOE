package config

import (
	"fmt"
	"os"

	"github.com/kurodakayn/ahf-qds-eoe/models"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// InitDB 初始化数据库连接
func InitDB() error {
	// 从环境变量获取数据库配置
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")
	charset := os.Getenv("DB_CHARSET")
	parseTime := os.Getenv("DB_PARSE_TIME")
	loc := os.Getenv("DB_LOC")

	// 构建MySQL DSN
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=%s&parseTime=%s&loc=%s",
		user, password, host, port, dbname, charset, parseTime, loc)

	// 连接数据库
	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return err
	}

	// 自动迁移数据库表
	err = DB.AutoMigrate(
		&models.User{},
		&models.QuestionBank{},
		&models.Question{},
		&models.QuestionRecord{},
	)
	return err
}

// GetDB 获取数据库连接实例
func GetDB() *gorm.DB {
	return DB
} 