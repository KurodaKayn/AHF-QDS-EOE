/**
 * 用户相关类型定义
 */

/**
 * 用户信息
 */
export interface User {
  id: number;
  username: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 用户认证状态
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

/**
 * 登录请求参数
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * 注册请求参数
 */
export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
}

/**
 * 认证响应
 */
export interface AuthResponse {
  token: string;
  user: User;
}

/**
 * 密码修改请求
 */
export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
} 