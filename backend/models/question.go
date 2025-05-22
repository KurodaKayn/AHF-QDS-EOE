package models

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

// QuestionType 题目类型枚举
type QuestionType string

const (
	SingleChoice   QuestionType = "single-choice"   // 单选题
	MultipleChoice QuestionType = "multiple-choice" // 多选题
	TrueFalse      QuestionType = "true-false"      // 判断题
	ShortAnswer    QuestionType = "short-answer"    // 简答题
	FillInBlank    QuestionType = "fill-in-blank"   // 填空题
)

// Option 题目选项
type Option struct {
	ID      string `json:"id"`
	Content string `json:"content"`
}

// Question 题目模型
type Question struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	BankID      uint           `json:"bank_id" gorm:"not null"` // 所属题库
	Type        QuestionType   `json:"type" gorm:"not null"`
	Content     string         `json:"content" gorm:"not null"`
	OptionsJSON string         `json:"-" gorm:"column:options_json"` // 数据库中存储JSON格式
	Answer      string         `json:"answer" gorm:"not null"`       // 单选题/判断题/简答题为字符串，多选题为JSON字符串数组
	Explanation string         `json:"explanation"`
	TagsJSON    string         `json:"-" gorm:"column:tags_json"` // 标签，用于分类
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

	// 虚拟字段，不存储在数据库中
	Options []Option `json:"options" gorm:"-"`
	Tags    []string `json:"tags" gorm:"-"`
}

// BeforeCreate GORM钩子函数，创建题目前处理JSON字段
func (q *Question) BeforeCreate(tx *gorm.DB) error {
	q.CreatedAt = time.Now()
	q.UpdatedAt = time.Now()

	// 将选项切片转为JSON字符串存储
	if len(q.Options) > 0 {
		optionsJSON, err := json.Marshal(q.Options)
		if err != nil {
			return err
		}
		q.OptionsJSON = string(optionsJSON)
	}

	// 将标签切片转为JSON字符串存储
	if len(q.Tags) > 0 {
		tagsJSON, err := json.Marshal(q.Tags)
		if err != nil {
			return err
		}
		q.TagsJSON = string(tagsJSON)
	}

	return nil
}

// BeforeUpdate GORM钩子函数，更新题目前处理JSON字段
func (q *Question) BeforeUpdate(tx *gorm.DB) error {
	q.UpdatedAt = time.Now()

	// 将选项切片转为JSON字符串存储
	if len(q.Options) > 0 {
		optionsJSON, err := json.Marshal(q.Options)
		if err != nil {
			return err
		}
		q.OptionsJSON = string(optionsJSON)
	}

	// 将标签切片转为JSON字符串存储
	if len(q.Tags) > 0 {
		tagsJSON, err := json.Marshal(q.Tags)
		if err != nil {
			return err
		}
		q.TagsJSON = string(tagsJSON)
	}

	return nil
}

// AfterFind GORM钩子函数，查询题目后处理JSON字段
func (q *Question) AfterFind(tx *gorm.DB) error {
	// 将选项JSON字符串转为切片
	if q.OptionsJSON != "" {
		var options []Option
		if err := json.Unmarshal([]byte(q.OptionsJSON), &options); err != nil {
			return err
		}
		q.Options = options
	}

	// 将标签JSON字符串转为切片
	if q.TagsJSON != "" {
		var tags []string
		if err := json.Unmarshal([]byte(q.TagsJSON), &tags); err != nil {
			return err
		}
		q.Tags = tags
	}

	return nil
} 