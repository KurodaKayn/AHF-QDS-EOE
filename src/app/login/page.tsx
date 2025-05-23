"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

/**
 * 用户登录页面组件
 * 
 * 功能：
 * 1. 提供用户登录表单界面
 * 2. 处理用户登录认证流程
 * 3. 显示登录错误信息
 * 4. 支持从注册页面跳转后的成功提示
 * 5. 登录成功后自动跳转到首页
 * 
 * 状态管理：
 * - formData: 存储用户输入的表单数据(用户名和密码)
 * - error: 存储登录过程中的错误信息
 * - loading: 表示登录请求是否正在进行中
 * - registrationSuccess: 标记是否从注册页面成功跳转而来
 * 
 * 路由参数：
 * - registered=true: 表示用户刚完成注册，显示成功提示
 */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 表单数据状态
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  
  // 错误信息状态
  const [error, setError] = useState("");
  
  // 加载状态，用于禁用按钮和显示加载指示器
  const [loading, setLoading] = useState(false);
  
  // 注册成功状态，用于显示注册成功提示
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  /**
   * 检查URL参数判断是否从注册页面跳转而来
   * 如果URL包含registered=true参数，则显示注册成功提示
   */
  useEffect(() => {
    // 检查是否是注册后跳转
    const registered = searchParams.get("registered");
    if (registered === "true") {
      setRegistrationSuccess(true);
    }
  }, [searchParams]);

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
   * 1. 执行表单验证
   * 2. 调用NextAuth的signIn方法进行认证
   * 3. 处理认证结果(成功跳转或显示错误)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 表单验证：确保所有必填字段已填写
    if (!formData.username || !formData.password) {
      setError("请填写所有必填字段");
      return;
    }

    // 设置加载状态，禁用提交按钮
    setLoading(true);

    try {
      // 调用NextAuth的signIn方法进行认证
      // redirect: false 表示不自动重定向，而是由我们手动处理结果
      const result = await signIn("credentials", {
        username: formData.username,
        password: formData.password,
        redirect: false
      });

      // 处理认证失败情况
      if (result?.error) {
        setError("用户名或密码错误");
        return;
      }

      // 登录成功，跳转到首页并刷新路由
      router.push("/");
      router.refresh();
    } catch (err: any) {
      // 捕获并显示其他错误
      setError("登录失败，请重试");
    } finally {
      // 无论成功失败，都重置加载状态
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        {/* 页面标题和注册链接 */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            登录账号
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            或{" "}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              还没有账号？注册
            </Link>
          </p>
        </div>

        {/* 注册成功提示，仅当从注册页面跳转而来时显示 */}
        {registrationSuccess && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  注册成功！请使用您的凭据登录
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 登录表单 */}
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
              {loading ? "登录中..." : "登录"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 