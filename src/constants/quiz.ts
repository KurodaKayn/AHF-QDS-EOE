import { QuestionType } from "@/types/quiz";

/**
 * 题目类型显示名称
 */
export const QUESTION_TYPE_NAMES: Record<QuestionType, string> = {
  [QuestionType.SingleChoice]: '单选题',
  [QuestionType.MultipleChoice]: '多选题',
  [QuestionType.TrueFalse]: '判断题',
  [QuestionType.ShortAnswer]: '简答题',
};

/**
 * 空题库名称
 */
export const DEFAULT_BANK_NAME = '未命名题库';

/**
 * 默认导出文件名
 */
export const DEFAULT_EXPORT_FILENAME = '题库导出';

/**
 * 示例题库
 */
export const EXAMPLE_QUESTION_TEXT = `1. 以下哪个不是 JavaScript 基本数据类型?( )
A. String
B. Number
C. Array
D. Boolean
正确答案:C:Array;

2. 哪个 JSP 动作标记用于动态包含另一个 JSP 页面?( )
A. jsp:forward
B. jsp:useBean
C. jsp:setProperty
D. jsp:include
正确答案:D:jsp:include;`;

/**
 * 题目标签颜色
 */
export const TAG_COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-yellow-100 text-yellow-800',
  'bg-red-100 text-red-800',
  'bg-purple-100 text-purple-800',
  'bg-pink-100 text-pink-800',
  'bg-indigo-100 text-indigo-800',
];

/**
 * 获取tag颜色
 */
export const getTagColor = (tag: string): string => {
  // 根据字符串生成一个稳定的索引
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash + tag.charCodeAt(i)) % TAG_COLORS.length;
  }
  return TAG_COLORS[hash];
}; 