package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kurodakayn/ahf-qds-eoe/middleware"
	"github.com/kurodakayn/ahf-qds-eoe/services"
)

// AIController AI相关控制器
type AIController struct {
	aiService services.AIService
}

// NewAIController 创建AI控制器实例
func NewAIController() *AIController {
	return &AIController{
		aiService: services.AIService{},
	}
}

// CallDeepSeek 调用DeepSeek API
func (c *AIController) CallDeepSeek(ctx *gin.Context) {
	var req struct {
		APIKey   string                 `json:"api_key" binding:"required"`
		BaseURL  string                 `json:"base_url,omitempty"`
		Messages []services.AIMessage   `json:"messages" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求参数: " + err.Error()})
		return
	}

	// 构建AI请求
	aiReq := services.AIRequest{
		Provider: services.DeepSeek,
		APIKey:   req.APIKey,
		BaseURL:  req.BaseURL,
		Messages: req.Messages,
	}

	// 调用AI服务
	response, err := c.aiService.CallAI(aiReq)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 返回AI响应
	ctx.JSON(http.StatusOK, gin.H{
		"choices": []map[string]interface{}{
			{
				"message": map[string]string{
					"content": response,
				},
			},
		},
	})
}

// CallAlibaba 调用阿里云通义千问 API
func (c *AIController) CallAlibaba(ctx *gin.Context) {
	var req struct {
		APIKey   string               `json:"api_key" binding:"required"`
		Messages []services.AIMessage `json:"messages" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求参数: " + err.Error()})
		return
	}

	// 构建AI请求
	aiReq := services.AIRequest{
		Provider: services.Alibaba,
		APIKey:   req.APIKey,
		Messages: req.Messages,
	}

	// 调用AI服务
	response, err := c.aiService.CallAI(aiReq)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 返回AI响应
	ctx.JSON(http.StatusOK, gin.H{
		"choices": []map[string]interface{}{
			{
				"message": map[string]string{
					"content": response,
				},
			},
		},
	})
}

// RegisterRoutes 注册AI相关路由
func (c *AIController) RegisterRoutes(router *gin.RouterGroup) {
	aiGroup := router.Group("/ai")
	
	// 无需身份验证的AI调用
	{
		aiGroup.POST("/deepseek", c.CallDeepSeek)
		aiGroup.POST("/alibaba", c.CallAlibaba)
	}

	// 需要身份验证的AI调用（如果有）
	authAI := aiGroup.Group("/auth")
	authAI.Use(middleware.JWTAuth())
	{
		// 如果需要添加需要身份验证的AI相关API
	}
} 