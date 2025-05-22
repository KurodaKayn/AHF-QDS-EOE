import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthState, User } from '@/types/auth';
import { UserAPI, getAuthToken } from '@/utils/api';

interface AuthStore extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  updateProfile: (email: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

// 初始认证状态
const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialAuthState,

      /**
       * 用户登录
       */
      login: async (username: string, password: string) => {
        set({ loading: true, error: null });
        try {
          const { token, user } = await UserAPI.login(username, password);
          set({
            isAuthenticated: true,
            user,
            loading: false,
            error: null,
          });
        } catch (error) {
          set({
            isAuthenticated: false,
            user: null,
            loading: false,
            error: error instanceof Error ? error.message : '登录失败',
          });
          throw error;
        }
      },

      /**
       * 用户注册
       */
      register: async (username: string, password: string, email?: string) => {
        set({ loading: true, error: null });
        try {
          const { token, user } = await UserAPI.register(username, password, email);
          set({
            isAuthenticated: true,
            user,
            loading: false,
            error: null,
          });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '注册失败',
          });
          throw error;
        }
      },

      /**
       * 用户登出
       */
      logout: () => {
        UserAPI.logout();
        set({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: null,
        });
      },

      /**
       * 检查认证状态
       */
      checkAuth: async () => {
        const token = getAuthToken();
        
        if (!token) {
          set({
            isAuthenticated: false,
            user: null,
          });
          return false;
        }
        
        try {
          const { user } = await UserAPI.getProfile();
          set({
            isAuthenticated: true,
            user,
            error: null,
          });
          return true;
        } catch (error) {
          // 如果获取用户信息失败（例如令牌已过期），则清除认证状态
          UserAPI.logout();
          set({
            isAuthenticated: false,
            user: null,
            error: error instanceof Error ? error.message : '认证无效',
          });
          return false;
        }
      },

      /**
       * 更新用户资料
       */
      updateProfile: async (email: string) => {
        set({ loading: true, error: null });
        try {
          const { user } = await UserAPI.updateProfile(email);
          set({
            user,
            loading: false,
            error: null,
          });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '更新资料失败',
          });
          throw error;
        }
      },

      /**
       * 修改密码
       */
      changePassword: async (oldPassword: string, newPassword: string) => {
        set({ loading: true, error: null });
        try {
          await UserAPI.changePassword(oldPassword, newPassword);
          set({
            loading: false,
            error: null,
          });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '修改密码失败',
          });
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated, user: state.user }),
    }
  )
);