package v1

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kurodakayn/ahf-qds-eoe/middleware"
	"github.com/kurodakayn/ahf-qds-eoe/models"
	"github.com/kurodakayn/ahf-qds-eoe/services"
)

// QuestionController 题目控制器
type QuestionController struct {
	questionService services.QuestionService
}

// NewQuestionController 创建题目控制器实例
func NewQuestionController() *QuestionController {
	return &QuestionController{
		questionService: services.QuestionService{},
	}
}

// Create 创建题目
func (c *QuestionController) Create(ctx *gin.Context) {
	userID, _ := ctx.Get("userID")
	bankID, err := strconv.ParseUint(ctx.Param("bankId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "无效的题库ID"})
		return
	}

	var question models.Question
	if err := ctx.ShouldBindJSON(&question); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求参数: " + err.Error()})
		return
	}

	createdQuestion, err := c.questionService.CreateQuestion(uint(bankID), userID.(uint), question)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message":  "题目创建成功",
		"question": createdQuestion,
	})
}

// GetBankQuestions 获取题库的所有题目
func (c *QuestionController) GetBankQuestions(ctx *gin.Context) {
	userID, _ := ctx.Get("userID")
	bankID, err := strconv.ParseUint(ctx.Param("bankId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "无效的题库ID"})
		return
	}

	questions, err := c.questionService.GetBankQuestions(uint(bankID), userID.(uint))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"questions": questions,
	})
}

// GetOne 获取题目详情
func (c *QuestionController) GetOne(ctx *gin.Context) {
	userID, _ := ctx.Get("userID")
	questionID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "无效的题目ID"})
		return
	}

	question, err := c.questionService.GetQuestion(uint(questionID), userID.(uint))
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"question": question,
	})
}

// Update 更新题目
func (c *QuestionController) Update(ctx *gin.Context) {
	userID, _ := ctx.Get("userID")
	questionID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "无效的题目ID"})
		return
	}

	var req map[string]interface{}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求参数: " + err.Error()})
		return
	}

	question, err := c.questionService.UpdateQuestion(uint(questionID), userID.(uint), req)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message":  "题目更新成功",
		"question": question,
	})
}

// Delete 删除题目
func (c *QuestionController) Delete(ctx *gin.Context) {
	userID, _ := ctx.Get("userID")
	questionID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "无效的题目ID"})
		return
	}

	err = c.questionService.DeleteQuestion(uint(questionID), userID.(uint))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "题目删除成功",
	})
}

// Import 批量导入题目
func (c *QuestionController) Import(ctx *gin.Context) {
	userID, _ := ctx.Get("userID")
	bankID, err := strconv.ParseUint(ctx.Param("bankId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "无效的题库ID"})
		return
	}

	var questions []models.Question
	if err := ctx.ShouldBindJSON(&questions); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求参数: " + err.Error()})
		return
	}

	importedCount, err := c.questionService.ImportQuestions(uint(bankID), userID.(uint), questions)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "题目导入成功",
		"count":   importedCount,
	})
}

// RegisterRoutes 注册题目相关路由
func (c *QuestionController) RegisterRoutes(router *gin.RouterGroup) {
	// 所有题目路由都需要认证
	questions := router.Group("/questions")
	questions.Use(middleware.JWTAuth())
	{
		questions.GET("/:id", c.GetOne)       // 获取题目详情
		questions.PUT("/:id", c.Update)       // 更新题目
		questions.DELETE("/:id", c.Delete)    // 删除题目
	}

	// 题库相关的题目路由
	bankQuestions := router.Group("/banks/:bankId/questions")
	bankQuestions.Use(middleware.JWTAuth())
	{
		bankQuestions.POST("", c.Create)                // 创建题目
		bankQuestions.GET("", c.GetBankQuestions)       // 获取题库的所有题目
		bankQuestions.POST("/import", c.Import)         // 批量导入题目
	}
} 