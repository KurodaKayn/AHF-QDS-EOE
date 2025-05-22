package services

import (
	"errors"

	"github.com/kurodakayn/ahf-qds-eoe/config"
	"github.com/kurodakayn/ahf-qds-eoe/models"
	"gorm.io/gorm"
)

// QuestionBankService 题库服务
type QuestionBankService struct{}

// CreateQuestionBank 创建题库
func (s *QuestionBankService) CreateQuestionBank(userID uint, name, description string) (*models.QuestionBank, error) {
	bank := models.QuestionBank{
		UserID:      userID,
		Name:        name,
		Description: description,
	}

	result := config.DB.Create(&bank)
	if result.Error != nil {
		return nil, result.Error
	}

	return &bank, nil
}

// GetUserQuestionBanks 获取用户的所有题库
func (s *QuestionBankService) GetUserQuestionBanks(userID uint) ([]models.QuestionBank, error) {
	var banks []models.QuestionBank
	result := config.DB.Where("user_id = ?", userID).Find(&banks)
	if result.Error != nil {
		return nil, result.Error
	}

	return banks, nil
}

// GetQuestionBankWithQuestions 获取题库及其所有题目
func (s *QuestionBankService) GetQuestionBankWithQuestions(bankID, userID uint) (*models.QuestionBank, error) {
	var bank models.QuestionBank
	result := config.DB.Preload("Questions").Where("id = ? AND user_id = ?", bankID, userID).First(&bank)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errors.New("题库不存在")
		}
		return nil, result.Error
	}

	return &bank, nil
}

// UpdateQuestionBank 更新题库信息
func (s *QuestionBankService) UpdateQuestionBank(bankID, userID uint, name, description string) (*models.QuestionBank, error) {
	// 先检查题库是否存在且属于该用户
	var bank models.QuestionBank
	result := config.DB.Where("id = ? AND user_id = ?", bankID, userID).First(&bank)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errors.New("题库不存在或无权限操作")
		}
		return nil, result.Error
	}

	// 更新题库信息
	updates := map[string]interface{}{
		"name":        name,
		"description": description,
	}
	result = config.DB.Model(&bank).Updates(updates)
	if result.Error != nil {
		return nil, result.Error
	}

	return &bank, nil
}

// DeleteQuestionBank 删除题库
func (s *QuestionBankService) DeleteQuestionBank(bankID, userID uint) error {
	// 检查题库是否存在且属于该用户
	var bank models.QuestionBank
	result := config.DB.Where("id = ? AND user_id = ?", bankID, userID).First(&bank)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return errors.New("题库不存在或无权限操作")
		}
		return result.Error
	}

	// 开始事务
	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 首先删除题库下的所有题目
	if err := tx.Where("bank_id = ?", bankID).Delete(&models.Question{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	// 删除题库
	if err := tx.Delete(&bank).Error; err != nil {
		tx.Rollback()
		return err
	}

	// 提交事务
	return tx.Commit().Error
} 