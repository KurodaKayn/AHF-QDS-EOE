package services

import (
	"errors"
	"time"

	"github.com/kurodakayn/ahf-qds-eoe/config"
	"github.com/kurodakayn/ahf-qds-eoe/models"
)

// QuestionRecordService 答题记录服务
type QuestionRecordService struct{}

// AddRecord 添加答题记录
func (s *QuestionRecordService) AddRecord(userID, questionID uint, userAnswer string, isCorrect bool) (*models.QuestionRecord, error) {
	// 检查题目是否存在
	var question models.Question
	result := config.DB.First(&question, questionID)
	if result.Error != nil {
		return nil, errors.New("题目不存在")
	}

	// 检查用户是否有权限（题目所属题库是否属于该用户）
	var count int64
	config.DB.Model(&models.QuestionBank{}).
		Joins("JOIN questions ON questions.bank_id = question_banks.id").
		Where("questions.id = ? AND question_banks.user_id = ?", questionID, userID).
		Count(&count)
	
	if count == 0 {
		return nil, errors.New("无权限操作此题目")
	}

	// 创建记录
	record := models.QuestionRecord{
		UserID:     userID,
		QuestionID: questionID,
		UserAnswer: userAnswer,
		IsCorrect:  isCorrect,
		AnsweredAt: time.Now(),
	}

	result = config.DB.Create(&record)
	if result.Error != nil {
		return nil, result.Error
	}

	return &record, nil
}

// GetUserRecords 获取用户的所有答题记录
func (s *QuestionRecordService) GetUserRecords(userID uint, isCorrect *bool) ([]models.QuestionRecord, error) {
	var records []models.QuestionRecord
	query := config.DB.Where("user_id = ?", userID)
	
	// 如果指定了是否正确，则添加条件
	if isCorrect != nil {
		query = query.Where("is_correct = ?", *isCorrect)
	}
	
	result := query.Order("answered_at DESC").Find(&records)
	if result.Error != nil {
		return nil, result.Error
	}

	return records, nil
}

// GetUserWrongQuestions 获取用户的所有错题
func (s *QuestionRecordService) GetUserWrongQuestions(userID uint) ([]models.Question, error) {
	var questions []models.Question
	
	// 查询用户回答错误的题目
	result := config.DB.Distinct("questions.*").
		Joins("JOIN question_records ON questions.id = question_records.question_id").
		Where("question_records.user_id = ? AND question_records.is_correct = ?", userID, false).
		Find(&questions)
	
	if result.Error != nil {
		return nil, result.Error
	}

	return questions, nil
}

// ClearRecords 清空用户的答题记录
func (s *QuestionRecordService) ClearRecords(userID uint, bankID *uint) error {
	query := config.DB.Where("user_id = ?", userID)
	
	// 如果指定了题库ID，则只清空该题库的记录
	if bankID != nil {
		query = query.Where("question_id IN (SELECT id FROM questions WHERE bank_id = ?)", *bankID)
	}
	
	result := query.Delete(&models.QuestionRecord{})
	return result.Error
}

// RemoveWrongRecord 移除错题记录
func (s *QuestionRecordService) RemoveWrongRecord(userID, questionID uint) error {
	result := config.DB.Where("user_id = ? AND question_id = ? AND is_correct = ?", userID, questionID, false).
		Delete(&models.QuestionRecord{})
	
	return result.Error
} 