package services

import (
	"errors"

	"github.com/kurodakayn/ahf-qds-eoe/config"
	"github.com/kurodakayn/ahf-qds-eoe/models"
)

// UserService 用户服务
type UserService struct{}

// Register 注册新用户
func (s *UserService) Register(username, password, email string) (*models.User, error) {
	// 检查用户名是否已存在
	var existingUser models.User
	result := config.DB.Where("username = ?", username).First(&existingUser)
	if result.RowsAffected > 0 {
		return nil, errors.New("用户名已被占用")
	}

	// 检查邮箱是否已存在
	if email != "" {
		result = config.DB.Where("email = ?", email).First(&existingUser)
		if result.RowsAffected > 0 {
			return nil, errors.New("邮箱已被注册")
		}
	}

	// 创建新用户
	user := models.User{
		Username: username,
		Email:    email,
	}

	// 设置密码
	err := user.SetPassword(password)
	if err != nil {
		return nil, err
	}

	// 保存用户到数据库
	result = config.DB.Create(&user)
	if result.Error != nil {
		return nil, result.Error
	}

	return &user, nil
}

// Login 用户登录
func (s *UserService) Login(username, password string) (*models.User, error) {
	var user models.User
	result := config.DB.Where("username = ?", username).First(&user)
	if result.RowsAffected == 0 {
		return nil, errors.New("用户不存在")
	}

	// 验证密码
	if !user.CheckPassword(password) {
		return nil, errors.New("密码不正确")
	}

	return &user, nil
}

// GetUserByID 根据ID获取用户
func (s *UserService) GetUserByID(id uint) (*models.User, error) {
	var user models.User
	result := config.DB.First(&user, id)
	if result.RowsAffected == 0 {
		return nil, errors.New("用户不存在")
	}
	return &user, nil
}

// UpdateUser 更新用户信息
func (s *UserService) UpdateUser(id uint, data map[string]interface{}) (*models.User, error) {
	user, err := s.GetUserByID(id)
	if err != nil {
		return nil, err
	}

	// 更新用户信息
	if err := config.DB.Model(&user).Updates(data).Error; err != nil {
		return nil, err
	}

	return user, nil
}

// ChangePassword 修改用户密码
func (s *UserService) ChangePassword(id uint, oldPassword, newPassword string) error {
	user, err := s.GetUserByID(id)
	if err != nil {
		return err
	}

	// 验证旧密码
	if !user.CheckPassword(oldPassword) {
		return errors.New("旧密码不正确")
	}

	// 设置新密码
	if err := user.SetPassword(newPassword); err != nil {
		return err
	}

	// 保存到数据库
	if err := config.DB.Save(user).Error; err != nil {
		return err
	}

	return nil
} 