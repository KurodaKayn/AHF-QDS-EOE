package v1

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kurodakayn/ahf-qds-eoe/middleware"
	"github.com/kurodakayn/ahf-qds-eoe/services"
)

// QuestionRecordController 答题记录控制器
type QuestionRecordController struct {
	recordService services.QuestionRecordService
}

// NewQuestionRecordController 创建答题记录控制器实例
func NewQuestionRecordController() *QuestionRecordController {
	return &QuestionRecordController{
		recordService: services.QuestionRecordService{},
	}
}

// AddRecord 添加答题记录
func (c *QuestionRecordController) AddRecord(ctx *gin.Context) {
	userID, _ := ctx.Get("userID")
	
	var req struct {
		QuestionID uint   `json:"question_id" binding:"required"`
		UserAnswer string `json:"user_answer" binding:"required"`
		IsCorrect  bool   `json:"is_correct" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求参数: " + err.Error()})
		return
	}

	record, err := c.recordService.AddRecord(userID.(uint), req.QuestionID, req.UserAnswer, req.IsCorrect)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "答题记录添加成功",
		"record":  record,
	})
}

// GetRecords 获取用户的答题记录
func (c *QuestionRecordController) GetRecords(ctx *gin.Context) {
	userID, _ := ctx.Get("userID")
	
	// 解析查询参数：是否只获取错题
	var isCorrect *bool
	if correctStr := ctx.Query("is_correct"); correctStr != "" {
		correct, err := strconv.ParseBool(correctStr)
		if err == nil {
			isCorrect = &correct
		}
	}
	
	records, err := c.recordService.GetUserRecords(userID.(uint), isCorrect)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"records": records,
	})
}

// GetWrongQuestions 获取用户的错题
func (c *QuestionRecordController) GetWrongQuestions(ctx *gin.Context) {
	userID, _ := ctx.Get("userID")
	
	questions, err := c.recordService.GetUserWrongQuestions(userID.(uint))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"questions": questions,
	})
}

// ClearRecords 清空用户的答题记录
func (c *QuestionRecordController) ClearRecords(ctx *gin.Context) {
	userID, _ := ctx.Get("userID")
	
	// 解析可选的题库ID
	var bankID *uint
	if bankIDStr := ctx.Query("bank_id"); bankIDStr != "" {
		id, err := strconv.ParseUint(bankIDStr, 10, 32)
		if err == nil {
			uintID := uint(id)
			bankID = &uintID
		}
	}
	
	err := c.recordService.ClearRecords(userID.(uint), bankID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "答题记录已清空",
	})
}

// RemoveWrongRecord 移除错题记录
func (c *QuestionRecordController) RemoveWrongRecord(ctx *gin.Context) {
	userID, _ := ctx.Get("userID")
	questionID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "无效的题目ID"})
		return
	}
	
	err = c.recordService.RemoveWrongRecord(userID.(uint), uint(questionID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "错题记录已移除",
	})
}

// RegisterRoutes 注册答题记录相关路由
func (c *QuestionRecordController) RegisterRoutes(router *gin.RouterGroup) {
	// 所有答题记录路由都需要认证
	records := router.Group("/records")
	records.Use(middleware.JWTAuth())
	{
		records.POST("", c.AddRecord)                   // 添加答题记录
		records.GET("", c.GetRecords)                   // 获取答题记录
		records.GET("/wrong", c.GetWrongQuestions)      // 获取错题
		records.DELETE("", c.ClearRecords)              // 清空答题记录
		records.DELETE("/:id/wrong", c.RemoveWrongRecord) // 移除错题记录
	}
} 