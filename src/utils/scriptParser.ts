import { Question, QuestionOption, QuestionType } from '@/types/quiz';
// Assuming createOptionId from quiz.ts is a simple ID generator and doesn\'t rely on store context
// If it does, we might need a simpler local generator or adjust its usage.
// For now, using a simple local GUID generator.
const generateGuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

interface ParsedOption extends QuestionOption {
  letter?: string; // To temporarily store the original letter like 'A', 'B'
}

/**
 * 支持的脚本模板类型
 */
export enum ScriptTemplate {
  ChaoXing = 'chaoxing', // 学习通
  Other = 'other', // 其它
}

/**
 * 解析文本输入成题目数据
 * @param text 原始文本输入
 * @param template 要使用的模板
 * @returns 解析后的题目数组
 */
export function parseTextByScript(
  text: string, 
  template: ScriptTemplate = ScriptTemplate.Other
): Omit<Question, 'id' | 'bankId'>[] {
  switch (template) {
    case ScriptTemplate.ChaoXing:
      return parseChaoXingTemplate(text);
    case ScriptTemplate.Other:
    default:
      return parseOtherTemplate(text);
  }
}

/**
 * 解析"其它"模板的文本
 * @param text 原始文本输入
 */
function parseOtherTemplate(text: string): Omit<Question, 'id' | 'bankId'>[] {
  const questions: Omit<Question, 'id' | 'bankId'>[] = [];
  if (!text.trim()) {
    return questions;
  }

  const questionBlocks = text.trim().split(/\n\s*\n/); // Split by one or more blank lines

  for (const block of questionBlocks) {
    const lines = block.trim().split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length < 3) continue; 

    let questionContent = '';
    const parsedOptions: ParsedOption[] = [];
    let correctAnswerLetter: string | null = null;
    const questionType: QuestionType = QuestionType.SingleChoice; 

    const questionLineMatch = lines[0].match(/^\d+\.\s*(.+?)(?:\s*\(\s*\))?$/);
    if (questionLineMatch && questionLineMatch[1]) {
      questionContent = questionLineMatch[1].trim();
    } else if (!lines[0].match(/^([A-Z])\.\s+/) && !lines[0].startsWith('正确答案:')) {
      questionContent = lines[0]; // Fallback: first line as content if not option/answer
    }
    
    if (!questionContent) continue;

    let answerLineFound = false;
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const optionMatch = line.match(/^([A-Z])\.\s+(.*)$/);
      if (optionMatch) {
        parsedOptions.push({
          id: generateGuid(), 
          content: optionMatch[2].trim(),
          letter: optionMatch[1],
        });
        continue;
      }

      const answerMatch = line.match(/^正确答案:([A-Z])(?:[:：](.*?))?;?$/);
      if (answerMatch) {
        correctAnswerLetter = answerMatch[1];
        answerLineFound = true;
        break; 
      }
    }
    
    if (!answerLineFound || !correctAnswerLetter || parsedOptions.length === 0) continue;

    const finalOptions: QuestionOption[] = parsedOptions.map(opt => ({ id: opt.id, content: opt.content }));
    let questionAnswer: string | string[] = '';

    const correctOption = parsedOptions.find(opt => opt.letter === correctAnswerLetter);
    if (correctOption) {
      questionAnswer = correctOption.id;
    } else {
      console.warn(`ScriptParser: Correct answer letter '${correctAnswerLetter}' not found in options for question: "${questionContent.substring(0, 50)}..."`);
      continue; 
    }
    
    const now = Date.now();
    questions.push({
      content: questionContent,
      type: questionType,
      options: finalOptions,
      answer: questionAnswer,
      explanation: '',
      tags: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  return questions;
}

/**
 * 解析"学习通"模板的文本
 * @param text 原始文本输入
 */
function parseChaoXingTemplate(text: string): Omit<Question, 'id' | 'bankId'>[] {
  const questions: Omit<Question, 'id' | 'bankId'>[] = [];
  if (!text.trim()) {
    return questions;
  }

  // 移除所有"AI讲解"及其后面的内容
  const cleanedText = text.replace(/AI讲解[\s\S]*?(?=\d+\.\s*\(|\Z)/g, '');
  
  // 按题目编号拆分文本
  const questionBlocks = cleanedText.split(/(?=\d+\.\s*\()/);
  
  for (const block of questionBlocks) {
    if (!block.trim()) continue;
    
    const lines = block.trim().split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length < 3) continue;
    
    let questionType: QuestionType;
    let questionContent = '';
    const parsedOptions: ParsedOption[] = [];
    let correctAnswerLetter: string | null = null;
    
    // 匹配问题类型和内容
    const questionMatch = lines[0].match(/^\d+\.\s*\(([^)]+)\)(.+)$/);
    if (questionMatch) {
      const typeText = questionMatch[1].toLowerCase();
      questionContent = questionMatch[2].trim();
      
      if (typeText.includes('单选题')) {
        questionType = QuestionType.SingleChoice;
      } else if (typeText.includes('多选题')) {
        questionType = QuestionType.MultipleChoice;
      } else if (typeText.includes('判断题')) {
        questionType = QuestionType.TrueFalse;
      } else {
        questionType = QuestionType.ShortAnswer;
      }
    } else {
      // 如果无法匹配标准格式，尝试提取问题内容
      questionContent = lines[0];
      questionType = QuestionType.SingleChoice; // 默认为单选
    }
    
    if (!questionContent) continue;
    
    // 解析选项
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      
      // 匹配选项行
      const optionMatch = line.match(/^([A-Z])\.\s+(.*)$/);
      if (optionMatch) {
        parsedOptions.push({
          id: generateGuid(),
          content: optionMatch[2].trim(),
          letter: optionMatch[1]
        });
        continue;
      }
      
      // 查找答案行（不要求正确答案后面的内容匹配）
      const answerMatch = line.match(/.*正确答案:([A-Z])(?:[^;]*);?/);
      if (answerMatch) {
        correctAnswerLetter = answerMatch[1];
        break;
      } else if (line.includes('正确答案:对') || line.includes('正确答案:错')) {
        // 处理判断题
        correctAnswerLetter = line.includes('正确答案:对') ? 'A' : 'B';
        // 如果是判断题但还没有选项，自动添加"对错"选项
        if (parsedOptions.length === 0 && questionType === QuestionType.TrueFalse) {
          parsedOptions.push({ id: generateGuid(), content: '对', letter: 'A' });
          parsedOptions.push({ id: generateGuid(), content: '错', letter: 'B' });
        }
        break;
      }
    }
    
    // 验证解析结果
    if (!correctAnswerLetter) continue;
    
    // 对于判断题，如果用户输入没有明确的A/B选项，但有"对/错"关键词，转换答案格式
    if (questionType === QuestionType.TrueFalse && parsedOptions.length === 0) {
      parsedOptions.push({ id: generateGuid(), content: '对', letter: 'A' });
      parsedOptions.push({ id: generateGuid(), content: '错', letter: 'B' });
      if (correctAnswerLetter.toUpperCase() === '对') {
        correctAnswerLetter = 'A';
      } else if (correctAnswerLetter.toUpperCase() === '错') {
        correctAnswerLetter = 'B';
      }
    }
    
    // 确保有选项且找到正确答案
    if (parsedOptions.length === 0) continue;
    
    const finalOptions: QuestionOption[] = parsedOptions.map(opt => ({ id: opt.id, content: opt.content }));
    let questionAnswer: string | string[] = '';
    
    if (questionType === QuestionType.MultipleChoice) {
      // 多选题处理（学习通格式可能有多个字母如"A,B,C"）
      const multiAnswers = correctAnswerLetter.split(/[,，、]/);
      questionAnswer = multiAnswers.map(letter => {
        const option = parsedOptions.find(opt => opt.letter === letter.trim());
        return option ? option.id : '';
      }).filter(Boolean);
      
      if (questionAnswer.length === 0) continue; // 没有找到有效答案选项
    } else {
      // 单选题和判断题处理
      const correctOption = parsedOptions.find(opt => opt.letter === correctAnswerLetter);
      if (correctOption) {
        questionAnswer = correctOption.id;
      } else {
        continue; // 找不到对应选项
      }
    }
    
    const now = Date.now();
    questions.push({
      content: questionContent,
      type: questionType,
      options: finalOptions,
      answer: questionAnswer,
      explanation: '',
      tags: [],
      createdAt: now,
      updatedAt: now,
    });
  }
  
  return questions;
} 