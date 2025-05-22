package models

import (
	"time"

	"gorm.io/gorm"
)

// QuestionBank 题库模型
type QuestionBank struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	UserID      uint           `json:"user_id" gorm:"not null"` // 所属用户
	Name        string         `json:"name" gorm:"not null"`
	Description string         `json:"description"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
	
	// 关联
	Questions []Question `json:"questions,omitempty" gorm:"foreignKey:BankID"`
	User      User       `json:"-" gorm:"foreignKey:UserID"`
}

// BeforeCreate GORM钩子函数，创建题库前自动设置创建时间
func (qb *QuestionBank) BeforeCreate(tx *gorm.DB) error {
	qb.CreatedAt = time.Now()
	qb.UpdatedAt = time.Now()
	return nil
}

// BeforeUpdate GORM钩子函数，更新题库前自动设置更新时间
func (qb *QuestionBank) BeforeUpdate(tx *gorm.DB) error {
	qb.UpdatedAt = time.Now()
	return nil
} 