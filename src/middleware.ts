import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * 中间件函数
 * 用于保护需要登录的路由
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // 定义公开路径，不需要认证
  const publicPaths = ['/login', '/register', '/api/register'];
  const isPublicPath = publicPaths.some(publicPath => path === publicPath || path.startsWith(publicPath));
  
  // 定义需要认证的API路径
  const protectedApiPaths = ['/api/questionbank', '/api/questions', '/api/records', '/api/settings'];
  const isProtectedApiPath = protectedApiPaths.some(apiPath => path.startsWith(apiPath));
  
  // Auth路径由Next Auth处理，不需要在这里检查
  const isAuthPath = path.startsWith('/api/auth');
  
  // 从cookie中获取认证token，添加secret参数
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  // 如果是API路径且需要保护，检查是否有有效token
  if (isProtectedApiPath) {
    if (!token) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }
  }
  
  // 公开路径处理：已经登录则重定向到首页
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // 私有路径处理：未登录则重定向到登录页
  if (!isPublicPath && !isAuthPath && !token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

// 配置匹配的路由
export const config = {
  matcher: [
    /*
     * 匹配所有路径除了：
     * - 静态文件（如 /favicon.ico, /images/*, /fonts/*）
     * - /_next/ 路径 (Next.js 内部路由)
     */
    '/((?!_next/static|_next/image|favicon.ico|images/|fonts/).*)',
  ],
}; 