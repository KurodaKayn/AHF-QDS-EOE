package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
)

// AIProvider AI提供商类型
type AIProvider string

const (
	// DeepSeek DeepSeek AI
	DeepSeek AIProvider = "deepseek"
	// Alibaba 阿里云通义千问
	Alibaba AIProvider = "alibaba"
)

// AIMessage 消息格式
type AIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// AIRequest AI请求参数
type AIRequest struct {
	Provider AIProvider `json:"provider"`
	APIKey   string     `json:"api_key"`
	BaseURL  string     `json:"base_url,omitempty"` // 仅DeepSeek需要
	Messages []AIMessage `json:"messages"`
}

// AIResponse AI响应格式
type AIResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// AIService AI服务
type AIService struct{}

// CallAI 调用AI服务
func (s *AIService) CallAI(req AIRequest) (string, error) {
	var apiURL string
	var requestBody map[string]interface{}

	switch req.Provider {
	case DeepSeek:
		baseURL := req.BaseURL
		if baseURL == "" {
			baseURL = "https://api.deepseek.com"
		}
		apiURL = baseURL + "/v1/chat/completions"
		requestBody = map[string]interface{}{
			"model":    "deepseek-chat",
			"messages": req.Messages,
		}
	case Alibaba:
		apiURL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
		requestBody = map[string]interface{}{
			"model":    "qwen-turbo",
			"messages": req.Messages,
		}
	default:
		return "", errors.New("不支持的AI提供商")
	}

	// 将请求体转换为JSON
	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return "", err
	}

	// 创建HTTP请求
	httpReq, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}

	// 设置请求头
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+req.APIKey)

	// 发送请求
	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	// 解析响应
	var aiResp AIResponse
	if err := json.NewDecoder(resp.Body).Decode(&aiResp); err != nil {
		return "", err
	}

	// 检查是否有错误
	if resp.StatusCode != http.StatusOK || aiResp.Error != nil {
		errMsg := "AI请求失败"
		if aiResp.Error != nil {
			errMsg = aiResp.Error.Message
		}
		return "", errors.New(errMsg)
	}

	// 返回AI回复内容
	if len(aiResp.Choices) > 0 {
		return aiResp.Choices[0].Message.Content, nil
	}

	return "", errors.New("AI返回了空响应")
} 