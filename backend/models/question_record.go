package models

import (
	"time"

	"gorm.io/gorm"
)

// QuestionRecord 用户答题记录模型
type QuestionRecord struct {
	ID         uint           `json:"id" gorm:"primaryKey"`
	UserID     uint           `json:"user_id" gorm:"not null"` // 所属用户
	QuestionID uint           `json:"question_id" gorm:"not null"`
	UserAnswer string         `json:"user_answer" gorm:"not null"` // 用户答案，可能是字符串或JSON字符串数组
	IsCorrect  bool           `json:"is_correct"`
	AnsweredAt time.Time      `json:"answered_at"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`
	
	// 关联
	User     User     `json:"-" gorm:"foreignKey:UserID"`
	Question Question `json:"-" gorm:"foreignKey:QuestionID"`
}

// BeforeCreate GORM钩子函数，创建记录前自动设置创建时间
func (qr *QuestionRecord) BeforeCreate(tx *gorm.DB) error {
	qr.CreatedAt = time.Now()
	qr.UpdatedAt = time.Now()
	if qr.AnsweredAt.IsZero() {
		qr.AnsweredAt = time.Now()
	}
	return nil
}

// BeforeUpdate GORM钩子函数，更新记录前自动设置更新时间
func (qr *QuestionRecord) BeforeUpdate(tx *gorm.DB) error {
	qr.UpdatedAt = time.Now()
	return nil
} 