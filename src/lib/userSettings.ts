import { prisma } from "./prisma";

/**
 * 用户设置接口
 */
export interface UserSettings {
  // 练习与复习设置
  shufflePracticeOptions: boolean;
  shuffleReviewOptions: boolean;
  shufflePracticeQuestionOrder: boolean;
  shuffleReviewQuestionOrder: boolean;
  markMistakeAsCorrectedOnReviewSuccess: boolean;
  checkDuplicateQuestion: boolean;
  
  // 主题设置
  theme: 'light' | 'dark' | 'system';
}

/**
 * 用户设置结构定义
 */
export interface UserSettingsData {
  // 主题设置
  theme: 'light' | 'dark' | 'system';
  
  // 练习设置
  shufflePracticeOptions: boolean;
  shuffleReviewOptions: boolean;
  shufflePracticeQuestionOrder: boolean;
  shuffleReviewQuestionOrder: boolean;
  markMistakeAsCorrectedOnReviewSuccess: boolean;
  checkDuplicateQuestion: boolean;
  
  // 新增设置项
  showDetailedExplanations: boolean;
  autoContinue: boolean;
  autoSaveProgress: boolean;
}

/**
 * 默认用户设置
 */
export const defaultSettings: UserSettingsData = {
  theme: 'system',
  shufflePracticeOptions: true,
  shuffleReviewOptions: true,
  shufflePracticeQuestionOrder: false,
  shuffleReviewQuestionOrder: false,
  markMistakeAsCorrectedOnReviewSuccess: true,
  checkDuplicateQuestion: true,
  
  // 新增设置项默认值
  showDetailedExplanations: true,
  autoContinue: false,
  autoSaveProgress: true
};

/**
 * 获取用户设置
 * 如果不存在则自动创建默认设置
 */
export async function getUserSettings(userId: string): Promise<UserSettingsData> {
  try {
    // 查找用户设置
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId }
    });

    // 如果设置存在则返回
    if (userSettings) {
      // 将JSON数据转换为UserSettingsData类型，并合并默认值确保数据完整
      return { ...defaultSettings, ...(userSettings.settings as Record<string, any>) };
    }

    // 不存在则创建默认设置
    const newSettings = await prisma.userSettings.create({
      data: {
        userId,
        settings: defaultSettings as unknown as Record<string, any>
      }
    });

    return { ...defaultSettings, ...(newSettings.settings as Record<string, any>) };
  } catch (error) {
    console.error('获取用户设置失败:', error);
    // 如果数据库操作失败，返回默认设置
    return defaultSettings;
  }
}

/**
 * 更新用户设置
 * @param userId 用户ID
 * @param settings 要更新的设置或部分设置
 */
export async function updateUserSettings(
  userId: string, 
  settings: Partial<UserSettingsData>
): Promise<UserSettingsData> {
  try {
    // 先获取当前设置
    const currentSettings = await getUserSettings(userId);
    
    // 合并新旧设置
    const updatedSettings = {
      ...currentSettings,
      ...settings
    };

    // 更新数据库
    const result = await prisma.userSettings.upsert({
      where: { userId },
      update: {
        settings: updatedSettings as unknown as Record<string, any>,
        updatedAt: new Date()
      },
      create: {
        userId,
        settings: updatedSettings as unknown as Record<string, any>
      }
    });

    return { ...defaultSettings, ...(result.settings as Record<string, any>) };
  } catch (error) {
    console.error('更新用户设置失败:', error);
    throw error;
  }
}

/**
 * 更新单个设置项
 * @param userId 用户ID
 * @param key 设置键
 * @param value 设置值
 */
export async function updateSingleSetting<K extends keyof UserSettingsData>(
  userId: string,
  key: K,
  value: UserSettingsData[K]
): Promise<UserSettingsData> {
  return updateUserSettings(userId, { [key]: value } as Partial<UserSettingsData>);
}

/**
 * 重置用户设置为默认值
 * @param userId 用户ID
 */
export async function resetUserSettings(userId: string): Promise<UserSettingsData> {
  try {
    const result = await prisma.userSettings.upsert({
      where: { userId },
      update: {
        settings: defaultSettings as unknown as Record<string, any>,
        updatedAt: new Date()
      },
      create: {
        userId,
        settings: defaultSettings as unknown as Record<string, any>
      }
    });

    return { ...defaultSettings, ...(result.settings as Record<string, any>) };
  } catch (error) {
    console.error('重置用户设置失败:', error);
    throw error;
  }
}