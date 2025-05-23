import { prisma } from "./prisma";

 
/**
 * 用户设置数据结构定义
 * 用于与数据库交互，包含所有可配置的用户偏好选项
 * 
 * 分类：
 * 1. 界面设置：如主题
 * 2. 练习行为设置：如打乱选项、题目顺序等
 * 3. 用户体验设置：如显示详细解释、自动继续等
 */
export interface UserSettingsData {
  // 主题设置 - 用户界面的颜色模式
  theme: 'light' | 'dark' | 'system';
  
  // 练习设置组
  shufflePracticeOptions: boolean;      // 练习模式下是否打乱选项顺序
  shuffleReviewOptions: boolean;        // 复习模式下是否打乱选项顺序
  shufflePracticeQuestionOrder: boolean; // 练习模式下是否打乱题目顺序
  shuffleReviewQuestionOrder: boolean;  // 复习模式下是否打乱题目顺序
  markMistakeAsCorrectedOnReviewSuccess: boolean; // 复习正确后是否从错题本移除
  checkDuplicateQuestion: boolean;      // 导入题目时是否检查重复
  
  // 用户体验设置组
  showDetailedExplanations: boolean;    // 是否显示详细解释
  autoContinue: boolean;               // 是否自动进入下一题
  autoSaveProgress: boolean;           // 是否自动保存进度
}

/**
 * 默认用户设置
 * 为新用户提供初始设置值，也用于合并不完整的设置数据
 * 所有新增设置项都需要在这里添加默认值
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
 * 
 * 流程：
 * 1. 根据用户ID查询设置记录
 * 2. 如果存在则返回，与默认值合并确保数据完整
 * 3. 不存在则创建默认设置记录并返回
 * 
 * 异常处理：
 * - 数据库操作失败时返回默认设置并记录错误
 * 
 * @param userId 用户ID
 * @returns Promise<UserSettingsData> 用户设置对象(包含所有字段)
 */
export async function getUserSettings(userId: string): Promise<UserSettingsData> {
  try {
    // 查找用户设置记录
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId }
    });

    // 如果设置记录存在则返回，合并默认值确保数据完整
    if (userSettings) {
      // 将JSON数据转换为UserSettingsData类型，并合并默认值确保数据完整
      // 先使用默认值，再覆盖存储的值，确保新增设置项有默认值
      return { ...defaultSettings, ...(userSettings.settings as Record<string, any>) };
    }

    // 若设置记录不存在，则创建新记录并使用默认设置
    const newSettings = await prisma.userSettings.create({
      data: {
        userId,
        settings: defaultSettings as unknown as Record<string, any>
      }
    });

    // 返回新创建的设置，同样合并默认值确保完整
    return { ...defaultSettings, ...(newSettings.settings as Record<string, any>) };
  } catch (error) {
    // 记录错误日志
    console.error('获取用户设置失败:', error);
    // 数据库操作失败时返回默认设置
    return defaultSettings;
  }
}

/**
 * 更新用户设置
 * 支持部分更新，只需提供要修改的字段
 * 
 * 流程：
 * 1. 先获取当前完整设置
 * 2. 合并新旧设置值
 * 3. 使用upsert保存，确保记录存在
 * 
 * @param userId 用户ID
 * @param settings 要更新的设置或部分设置
 * @returns Promise<UserSettingsData> 更新后的完整设置
 * @throws 数据库操作失败时抛出异常
 */
export async function updateUserSettings(
  userId: string, 
  settings: Partial<UserSettingsData>
): Promise<UserSettingsData> {
  try {
    // 先获取当前完整设置
    const currentSettings = await getUserSettings(userId);
    
    // 合并新旧设置值，新值覆盖旧值
    const updatedSettings = {
      ...currentSettings,
      ...settings
    };

    // 使用upsert操作，确保记录存在
    // 如果记录已存在则更新，不存在则创建
    const result = await prisma.userSettings.upsert({
      where: { userId },
      update: {
        settings: updatedSettings as unknown as Record<string, any>,
        updatedAt: new Date() // 更新时间戳
      },
      create: {
        userId,
        settings: updatedSettings as unknown as Record<string, any>
      }
    });

    // 返回更新后的设置，合并默认值确保完整
    return { ...defaultSettings, ...(result.settings as Record<string, any>) };
  } catch (error) {
    // 记录错误日志并继续抛出，由调用者处理
    console.error('更新用户设置失败:', error);
    throw error;
  }
}

/**
 * 更新单个设置项
 * 封装updateUserSettings，简化单字段更新操作
 * 
 * @param userId 用户ID
 * @param key 设置键名
 * @param value 设置新值
 * @returns Promise<UserSettingsData> 更新后的完整设置
 * @throws 数据库操作失败时抛出异常
 */
export async function updateSingleSetting<K extends keyof UserSettingsData>(
  userId: string,
  key: K,
  value: UserSettingsData[K]
): Promise<UserSettingsData> {
  // 创建部分设置对象并调用完整更新函数
  return updateUserSettings(userId, { [key]: value } as Partial<UserSettingsData>);
}

/**
 * 重置用户设置为默认值
 * 将用户的所有设置恢复到系统默认值
 * 
 * @param userId 用户ID
 * @returns Promise<UserSettingsData> 重置后的默认设置
 * @throws 数据库操作失败时抛出异常
 */
export async function resetUserSettings(userId: string): Promise<UserSettingsData> {
  try {
    // 使用upsert操作，确保记录存在
    // 无论是更新还是创建，都使用默认设置值
    const result = await prisma.userSettings.upsert({
      where: { userId },
      update: {
        settings: defaultSettings as unknown as Record<string, any>,
        updatedAt: new Date() // 更新时间戳
      },
      create: {
        userId,
        settings: defaultSettings as unknown as Record<string, any>
      }
    });

    // 返回重置后的设置，合并默认值确保完整
    return { ...defaultSettings, ...(result.settings as Record<string, any>) };
  } catch (error) {
    // 记录错误日志并继续抛出，由调用者处理
    console.error('重置用户设置失败:', error);
    throw error;
  }
}