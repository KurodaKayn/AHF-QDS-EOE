package services

import (
	"errors"

	"github.com/kurodakayn/ahf-qds-eoe/config"
	"github.com/kurodakayn/ahf-qds-eoe/models"
	"gorm.io/gorm"
)

// QuestionService 题目服务
type QuestionService struct{}

// CreateQuestion 创建题目
func (s *QuestionService) CreateQuestion(bankID, userID uint, question models.Question) (*models.Question, error) {
	// 检查题库是否存在且属于该用户
	var bank models.QuestionBank
	result := config.DB.Where("id = ? AND user_id = ?", bankID, userID).First(&bank)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errors.New("题库不存在或无权限操作")
		}
		return nil, result.Error
	}

	// 设置题目所属题库
	question.BankID = bankID

	// 保存题目
	result = config.DB.Create(&question)
	if result.Error != nil {
		return nil, result.Error
	}

	return &question, nil
}

// GetQuestion 获取题目详情
func (s *QuestionService) GetQuestion(questionID, userID uint) (*models.Question, error) {
	var question models.Question
	// 联合查询确保用户有权限访问该题目
	result := config.DB.Joins("JOIN question_banks ON questions.bank_id = question_banks.id").
		Where("questions.id = ? AND question_banks.user_id = ?", questionID, userID).
		First(&question)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errors.New("题目不存在或无权限访问")
		}
		return nil, result.Error
	}

	return &question, nil
}

// UpdateQuestion 更新题目
func (s *QuestionService) UpdateQuestion(questionID, userID uint, updates map[string]interface{}) (*models.Question, error) {
	// 获取题目并确认权限
	question, err := s.GetQuestion(questionID, userID)
	if err != nil {
		return nil, err
	}

	// 更新题目
	result := config.DB.Model(question).Updates(updates)
	if result.Error != nil {
		return nil, result.Error
	}

	// 重新获取更新后的题目
	return s.GetQuestion(questionID, userID)
}

// DeleteQuestion 删除题目
func (s *QuestionService) DeleteQuestion(questionID, userID uint) error {
	// 获取题目并确认权限
	question, err := s.GetQuestion(questionID, userID)
	if err != nil {
		return err
	}

	// 删除题目
	result := config.DB.Delete(question)
	return result.Error
}

// GetBankQuestions 获取题库中的所有题目
func (s *QuestionService) GetBankQuestions(bankID, userID uint) ([]models.Question, error) {
	// 检查题库是否存在且属于该用户
	var bank models.QuestionBank
	result := config.DB.Where("id = ? AND user_id = ?", bankID, userID).First(&bank)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errors.New("题库不存在或无权限操作")
		}
		return nil, result.Error
	}

	// 获取题库中的所有题目
	var questions []models.Question
	result = config.DB.Where("bank_id = ?", bankID).Find(&questions)
	if result.Error != nil {
		return nil, result.Error
	}

	return questions, nil
}

// ImportQuestions 批量导入题目
func (s *QuestionService) ImportQuestions(bankID, userID uint, questions []models.Question) (int, error) {
	// 检查题库是否存在且属于该用户
	var bank models.QuestionBank
	result := config.DB.Where("id = ? AND user_id = ?", bankID, userID).First(&bank)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return 0, errors.New("题库不存在或无权限操作")
		}
		return 0, result.Error
	}

	// 开始事务
	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	importedCount := 0
	for i := range questions {
		// 设置题目所属题库
		questions[i].BankID = bankID

		// 保存题目
		if err := tx.Create(&questions[i]).Error; err != nil {
			tx.Rollback()
			return 0, err
		}
		importedCount++
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		return 0, err
	}

	return importedCount, nil
} 