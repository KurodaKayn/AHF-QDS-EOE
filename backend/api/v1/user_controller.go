package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kurodakayn/ahf-qds-eoe/middleware"
	"github.com/kurodakayn/ahf-qds-eoe/services"
)

// UserController 用户控制器
type UserController struct {
	userService services.UserService
}

// NewUserController 创建用户控制器实例
func NewUserController() *UserController {
	return &UserController{
		userService: services.UserService{},
	}
}

// Register 用户注册
func (c *UserController) Register(ctx *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required,min=3,max=20"`
		Password string `json:"password" binding:"required,min=6"`
		Email    string `json:"email" binding:"omitempty,email"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求参数: " + err.Error()})
		return
	}

	user, err := c.userService.Register(req.Username, req.Password, req.Email)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 生成JWT令牌
	token, err := middleware.GenerateToken(user.ID, user.Username)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "生成令牌失败: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "注册成功",
		"token":   token,
		"user": map[string]interface{}{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
		},
	})
}

// Login 用户登录
func (c *UserController) Login(ctx *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求参数: " + err.Error()})
		return
	}

	user, err := c.userService.Login(req.Username, req.Password)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// 生成JWT令牌
	token, err := middleware.GenerateToken(user.ID, user.Username)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "生成令牌失败: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "登录成功",
		"token":   token,
		"user": map[string]interface{}{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
		},
	})
}

// GetProfile 获取用户个人资料
func (c *UserController) GetProfile(ctx *gin.Context) {
	userID, _ := ctx.Get("userID")
	
	user, err := c.userService.GetUserByID(userID.(uint))
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"user": map[string]interface{}{
			"id":        user.ID,
			"username":  user.Username,
			"email":     user.Email,
			"createdAt": user.CreatedAt,
		},
	})
}

// UpdateProfile 更新用户个人资料
func (c *UserController) UpdateProfile(ctx *gin.Context) {
	userID, _ := ctx.Get("userID")
	
	var req struct {
		Email string `json:"email" binding:"omitempty,email"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求参数: " + err.Error()})
		return
	}

	// 构建更新数据
	updates := map[string]interface{}{}
	if req.Email != "" {
		updates["email"] = req.Email
	}

	if len(updates) == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "没有提供有效的更新数据"})
		return
	}

	user, err := c.userService.UpdateUser(userID.(uint), updates)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "个人资料更新成功",
		"user": map[string]interface{}{
			"id":        user.ID,
			"username":  user.Username,
			"email":     user.Email,
			"createdAt": user.CreatedAt,
			"updatedAt": user.UpdatedAt,
		},
	})
}

// ChangePassword 修改密码
func (c *UserController) ChangePassword(ctx *gin.Context) {
	userID, _ := ctx.Get("userID")
	
	var req struct {
		OldPassword string `json:"old_password" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=6"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求参数: " + err.Error()})
		return
	}

	err := c.userService.ChangePassword(userID.(uint), req.OldPassword, req.NewPassword)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "密码修改成功"})
}

// RegisterRoutes 注册用户相关路由
func (c *UserController) RegisterRoutes(router *gin.RouterGroup) {
	router.POST("/register", c.Register)
	router.POST("/login", c.Login)
	
	// 需要认证的路由
	auth := router.Group("/")
	auth.Use(middleware.JWTAuth())
	{
		auth.GET("/profile", c.GetProfile)
		auth.PUT("/profile", c.UpdateProfile)
		auth.POST("/change-password", c.ChangePassword)
	}
} 