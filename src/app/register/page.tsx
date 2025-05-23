"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * 用户注册页面组件
 * 
 * 功能：
 * 1. 提供用户注册表单界面
 * 2. 处理用户注册流程，包括表单验证和提交
 * 3. 显示注册过程中的错误信息
 * 4. 注册成功后自动跳转到登录页面
 * 
 * 状态管理：
 * - formData: 存储用户输入的表单数据(用户名、邮箱、密码和确认密码)
 * - error: 存储注册过程中的错误信息
 * - loading: 表示注册请求是否正在进行中
 * 
 * API交互：
 * - 向/api/register发送POST请求创建新用户
 * - 成功后跳转到登录页面并传递registered=true参数
 */
export default function RegisterPage() {
  const router = useRouter();
  
  // 表单数据状态
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  // 错误信息状态
  const [error, setError] = useState("");
  
  // 加载状态，用于禁用按钮和显示加载指示器
  const [loading, setLoading] = useState(false);

  /**
   * 处理表单输入变化
   * 更新formData状态，保存用户输入的值
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * 处理表单提交
   * 1. 执行表单验证(必填字段和密码匹配)
   * 2. 向API发送注册请求
   * 3. 处理注册结果(成功跳转或显示错误)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 表单验证：确保所有必填字段已填写
    if (!formData.username || !formData.email || !formData.password) {
      setError("请填写所有必填字段");
      return;
    }

    // 表单验证：确保两次输入的密码一致
    if (formData.password !== formData.confirmPassword) {
      setError("两次密码输入不一致");
      return;
    }

    // 设置加载状态，禁用提交按钮
    setLoading(true);

    try {
      // 发送注册请求到后端API
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      // 处理注册失败情况
      if (!response.ok) {
        throw new Error(data.error || "注册失败");
      }

      // 注册成功，跳转到登录页面并传递registered=true参数
      // 这将触发登录页面显示注册成功的提示
      router.push("/login?registered=true");
    } catch (err: any) {
      // 捕获并显示API错误或网络错误
      setError(err.message);
    } finally {
      // 无论成功失败，都重置加载状态
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        {/* 页面标题和登录链接 */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            创建新账号
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            或{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              已有账号？登录
            </Link>
          </p>
        </div>

        {/* 注册表单 */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            {/* 用户名输入框 */}
            <div>
              <label htmlFor="username" className="sr-only">
                用户名
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="relative block w-full rounded-md border-0 p-3 text-gray-900 ring-1 ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-600"
                placeholder="用户名"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            
            {/* 邮箱输入框 */}
            <div>
              <label htmlFor="email" className="sr-only">
                邮箱
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="relative block w-full rounded-md border-0 p-3 text-gray-900 ring-1 ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-600"
                placeholder="邮箱地址"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            {/* 密码输入框 */}
            <div>
              <label htmlFor="password" className="sr-only">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="relative block w-full rounded-md border-0 p-3 text-gray-900 ring-1 ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-600"
                placeholder="密码"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            
            {/* 确认密码输入框 */}
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                确认密码
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="relative block w-full rounded-md border-0 p-3 text-gray-900 ring-1 ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-600"
                placeholder="确认密码"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* 错误信息显示区域 */}
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          {/* 提交按钮 */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-blue-600 py-3 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
            >
              {loading ? "注册中..." : "注册"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 