package v1

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kurodakayn/ahf-qds-eoe/middleware"
	"github.com/kurodakayn/ahf-qds-eoe/services"
)

// QuestionBankController 题库控制器
type QuestionBankController struct {
	bankService services.QuestionBankService
}

// NewQuestionBankController 创建题库控制器实例
func NewQuestionBankController() *QuestionBankController {
	return &QuestionBankController{
		bankService: services.QuestionBankService{},
	}
}

// Create 创建题库
func (c *QuestionBankController) Create(ctx *gin.Context) {
	userID, _ := ctx.Get("userID")
	
	var req struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求参数: " + err.Error()})
		return
	}

	bank, err := c.bankService.CreateQuestionBank(userID.(uint), req.Name, req.Description)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "题库创建成功",
		"bank":    bank,
	})
}

// GetAll 获取用户的所有题库
func (c *QuestionBankController) GetAll(ctx *gin.Context) {
	userID, _ := ctx.Get("userID")
	
	banks, err := c.bankService.GetUserQuestionBanks(userID.(uint))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"banks": banks,
	})
}

// GetOne 获取题库详情
func (c *QuestionBankController) GetOne(ctx *gin.Context) {
	userID, _ := ctx.Get("userID")
	bankID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "无效的题库ID"})
		return
	}

	bank, err := c.bankService.GetQuestionBankWithQuestions(uint(bankID), userID.(uint))
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"bank": bank,
	})
}

// Update 更新题库
func (c *QuestionBankController) Update(ctx *gin.Context) {
	userID, _ := ctx.Get("userID")
	bankID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "无效的题库ID"})
		return
	}

	var req struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求参数: " + err.Error()})
		return
	}

	bank, err := c.bankService.UpdateQuestionBank(uint(bankID), userID.(uint), req.Name, req.Description)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "题库更新成功",
		"bank":    bank,
	})
}

// Delete 删除题库
func (c *QuestionBankController) Delete(ctx *gin.Context) {
	userID, _ := ctx.Get("userID")
	bankID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "无效的题库ID"})
		return
	}

	err = c.bankService.DeleteQuestionBank(uint(bankID), userID.(uint))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "题库删除成功",
	})
}

// RegisterRoutes 注册题库相关路由
func (c *QuestionBankController) RegisterRoutes(router *gin.RouterGroup) {
	// 所有题库路由都需要认证
	banks := router.Group("/banks")
	banks.Use(middleware.JWTAuth())
	{
		banks.POST("", c.Create)         // 创建题库
		banks.GET("", c.GetAll)          // 获取所有题库
		banks.GET("/:id", c.GetOne)      // 获取单个题库详情
		banks.PUT("/:id", c.Update)      // 更新题库
		banks.DELETE("/:id", c.Delete)   // 删除题库
	}
} 