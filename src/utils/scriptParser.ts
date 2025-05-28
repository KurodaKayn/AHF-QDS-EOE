import { Question, QuestionOption, QuestionType } from '@/types/quiz';
const generateGuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

interface ParsedOption extends QuestionOption {
  letter?: string; // 临时存储原始字母如'A', 'B'
}

/**
 * 支持的脚本模板类型
 */
export enum ScriptTemplate {
  ChaoXing = 'chaoxing', // 学习通
  Other = 'other', // 其它
  SingleChoice1 = 'singlechoice1', // 单选题1格式
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
    case ScriptTemplate.SingleChoice1:
      return parseSingleChoice1Template(text);
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

  const questionBlocks = text.trim().split(/\n\s*\n/); // 按一个或多个空行拆分

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
      questionContent = lines[0]; // 回退：如果第一行不是选项且不是答案行，则作为题目内容
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

  // 预处理：删除多余空格和换行，统一冒号格式
  let cleanedText = text.replace(/\r\n/g, '\n').replace(/\n\s*\n/g, '\n');
  
  // 改进: 更精细地处理AI讲解，确保不会干扰题目识别
  // 先标记所有AI讲解的位置，而不是直接删除
  // 这里处理的是题目文本中可能包含的"AI讲解"部分，通过将其替换为特殊标记
  // 以便在后续处理中能够正确识别题目边界
  cleanedText = cleanedText.replace(/AI讲解/g, '###AI讲解###');
  
  // 打印调试信息
  console.log("处理学习通格式文本，字符数：", cleanedText.length);
  console.log("预处理后前100个字符:", cleanedText.substring(0, 100));
  
  // 改进: 更精确的题目识别模式，使用多个策略匹配
  // 策略1: 按题号和类型匹配 - 例如 "3. (单选题)"
  // 使用正则表达式匹配题目，并考虑AI讲解标记作为题目边界
  const questionRegex1 = /(\d+\s*\.\s*\([^)]+\)[^]*?)(?=\d+\s*\.\s*\(|\s*###AI讲解###|$)/g;
  // 策略2: 按题号和"我的答案"+"正确答案"模式匹配
  const questionRegex2 = /(\d+\s*\.\s*[^]*?我的答案[^]*?正确答案[^]*?)(?=\d+\s*\.\s*|\s*###AI讲解###|$)/g;
  // 策略3: 按题号和分数行匹配
  const questionRegex3 = /(\d+\s*\.\s*[^]*?\d+\.?\d*分\s*)(?=\d+\s*\.\s*|\s*###AI讲解###|$)/g;
  
  // 尝试所有匹配策略
  let matches1 = Array.from(cleanedText.matchAll(questionRegex1));
  console.log("策略1匹配到题目数量：", matches1.length);
  
  let matches2 = Array.from(cleanedText.matchAll(questionRegex2));
  console.log("策略2匹配到题目数量：", matches2.length);
  
  let matches3 = Array.from(cleanedText.matchAll(questionRegex3));
  console.log("策略3匹配到题目数量：", matches3.length);
  
  // 选择匹配数量最多的策略
  let questionBlocks: string[] = [];
  let bestMatches = matches1;
  if (matches2.length > bestMatches.length) bestMatches = matches2;
  if (matches3.length > bestMatches.length) bestMatches = matches3;
  
  if (bestMatches.length > 0) {
    questionBlocks = bestMatches.map(match => match[1].trim());
    console.log("选择最佳匹配策略，匹配数量：", bestMatches.length);
  } else {
    // 如果所有策略都失败，回退到简单的题号分割
    questionBlocks = cleanedText.split(/(?=\d+\s*\.\s*\()/);
    console.log("所有匹配策略失败，使用简单分割，块数：", questionBlocks.length);
  }
  
  // 记录每个题目块的前50个字符，帮助调试
  console.log("题目块预览：");
  questionBlocks.forEach((block, i) => {
    console.log(`块${i+1}的前50个字符: "${block.substring(0, 50).replace(/\n/g, '\\n')}..."`);
  });
  
  // 过滤掉过短或无效的块
  questionBlocks = questionBlocks.filter(block => {
    // 块至少应该包含题目标识和一些内容
    return block.trim().length > 10 && /\d+\s*\.\s*/.test(block);
  });
  console.log("过滤后的有效题目块数量：", questionBlocks.length);
  
  // 处理每个题目块
  for (let i = 0; i < questionBlocks.length; i++) {
    // 从题目块中移除AI讲解部分，确保不影响题目内容的提取
    // 这里使用正则表达式匹配并移除所有AI讲解标记及其后面的内容，直到下一个题目或文本结束
    const block = questionBlocks[i].replace(/###AI讲解###[^]*?(?=\d+\s*\.\s*|$)/g, '');
    if (!block.trim()) {
      console.log(`跳过空的题目块 ${i+1}`);
      continue;
    }
    
    console.log(`\n处理第${i+1}个题目块：长度=${block.length}`);
    console.log(`题目块前100字符: "${block.substring(0, 100).replace(/\n/g, '\\n')}..."`);
    
    // 按行拆分，清理每行
    const lines = block.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (lines.length < 2) {
      console.log("行数不足，跳过");
      continue;
    }
    
    // 提取题目内容和类型
    let questionType: QuestionType;
    let questionContent = '';
    
    // 改进: 增强题目类型和内容提取的稳健性
    // 匹配题目类型和内容 - 格式：数字. (类型)内容
    const questionTypeMatch = lines[0].match(/^\d+\s*\.\s*(?:\(([^)]+)\))?\s*(.+)$/);
    
    if (questionTypeMatch) {
      // questionTypeMatch[1]可能是undefined（如果没有括号类型）
      const typeText = questionTypeMatch[1] ? questionTypeMatch[1].toLowerCase() : '';
      questionContent = questionTypeMatch[2].trim();
      
      console.log("提取到题目类型:", typeText || '无类型标记');
      console.log("提取到题目内容:", questionContent);
      
      if (typeText.includes('填空')) {
        questionType = QuestionType.FillInBlank;
      } else if (typeText.includes('单选')) {
        questionType = QuestionType.SingleChoice;
      } else if (typeText.includes('多选')) {
        questionType = QuestionType.MultipleChoice;
      } else if (typeText.includes('判断')) {
        questionType = QuestionType.TrueFalse;
      } else {
        // 尝试从内容推断题型
        if (block.includes('A.') || block.includes('A．') || block.match(/\([A-D]\)/)) {
          // 有ABCD选项标记，可能是选择题
          questionType = block.includes('正确答案:') && block.match(/正确答案[:：]\s*[A-D],?[A-D]?/) 
            ? QuestionType.MultipleChoice // 有多个字母的是多选
            : QuestionType.SingleChoice;  // 否则是单选
        } else if (block.includes('判断') || block.includes('正确答案:对') || block.includes('正确答案:错')) {
          questionType = QuestionType.TrueFalse;
        } else if (block.includes('____') || block.includes('填空')) {
          questionType = QuestionType.FillInBlank;
        } else {
          questionType = QuestionType.SingleChoice; // 默认
        }
        console.log("从内容推断题型:", questionType);
      }
    } else {
      // 无法匹配标准格式，尝试更宽松的提取
      console.log("无法匹配标准题目格式，尝试备用提取");
      
      // 查找第一行中的数字+点格式
      const basicMatch = lines[0].match(/^\d+\s*\.\s*(.+)$/);
      if (basicMatch) {
        questionContent = basicMatch[1].trim();
      } else {
        questionContent = lines[0]; // 回退到使用整行
      }
      
      // 尝试从内容和后续行推断题型
      if (lines.some(l => l.match(/^[A-D][\.\．]/) || l.match(/\([A-D]\)/))) {
        // 检测是否有多个答案标记
        const multiAnswer = lines.some(l => 
          l.match(/正确答案[:：]\s*[A-D][,，、][A-D]/) || 
          l.match(/正确答案[:：]\s*\[[A-D][,，、][A-D]\]/));
          
        questionType = multiAnswer ? QuestionType.MultipleChoice : QuestionType.SingleChoice;
      } else if (lines.some(l => l.includes('判断') || l.includes('正确答案:对') || l.includes('正确答案:错'))) {
        questionType = QuestionType.TrueFalse;
      } else if (questionContent.includes('____') || lines.some(l => l.includes('填空'))) {
        questionType = QuestionType.FillInBlank;
      } else {
        questionType = QuestionType.SingleChoice; // 默认
      }
      
      console.log("备用方法提取题目内容:", questionContent);
      console.log("备用方法推断题型:", questionType);
    }
    
    if (!questionContent) {
      console.log("未提取到题目内容，跳过");
      continue;
    }
    
    // 特殊处理填空题
    if (questionType === QuestionType.FillInBlank) {
      let correctAnswer = '';
      
      // 查找答案模式，从多种可能的格式中尝试提取
      let foundAnswer = false;
      
      // 1. 查找标准"正确答案"行
      for (let j = 1; j < lines.length; j++) {
        const line = lines[j].trim();
        
        // 模式1: 直接查找"正确答案："行后的内容
        if (line.match(/正确答案[:：]/i)) {
          console.log("找到正确答案行:", line);
          
          // 尝试匹配学习通常见格式: "正确答案：(1) xxx"
          const regexWithNumber = /正确答案[:：]\s*\(?(?:\d+)\)?\s*(.+)/i;
          const answerMatch = line.match(regexWithNumber);
          if (answerMatch && answerMatch[1]) {
            correctAnswer = answerMatch[1].trim();
            console.log("匹配到答案:", correctAnswer);
            foundAnswer = true;
            break;
          }
          
          // 尝试直接提取冒号后所有内容
          const simpleMatch = /正确答案[:：]\s*(.+)/i;
          const simpleResult = line.match(simpleMatch);
          if (simpleResult && simpleResult[1]) {
            correctAnswer = simpleResult[1].trim();
            console.log("匹配到简单格式答案:", correctAnswer);
            foundAnswer = true;
            break;
          }
        }
      }
      
      // 2. 如果上面没找到，尝试查找"正确答案"行后的下一行
      if (!foundAnswer) {
        for (let j = 1; j < lines.length - 1; j++) {
          if (lines[j].match(/正确答案[:：]\s*$/i)) {
            console.log("找到空的正确答案行，查看下一行");
            const nextLine = lines[j+1].trim();
            
            // 尝试匹配 (1) 开头的行
            const numAnswer = nextLine.match(/^\(?(\d+)\)?\s*(.+)$/);
            if (numAnswer) {
              correctAnswer = numAnswer[2].trim();
              console.log("从下一行匹配到答案:", correctAnswer);
              foundAnswer = true;
              break;
            }
          }
        }
      }
      
      // 3. 如果还是没找到，尝试其他格式
      if (!foundAnswer) {
        console.log("使用备用方法查找答案");
        
        // 尝试先找到"我的答案"部分，然后查找之后的"正确答案"部分
        let myAnswerIndex = -1;
        for (let j = 1; j < lines.length; j++) {
          if (lines[j].match(/我的答案[:：]/i)) {
            myAnswerIndex = j;
            break;
          }
        }
        
        if (myAnswerIndex > 0 && myAnswerIndex < lines.length - 1) {
          // 从"我的答案"之后查找"正确答案"
          for (let j = myAnswerIndex + 1; j < lines.length; j++) {
            const line = lines[j].trim();
            if (line.match(/正确答案[:：]/i)) {
              // 提取格式如 "正确答案：(1) param"
              const match = line.match(/正确答案[:：]\s*(?:\((?:\d+)\))?\s*(.+)/i);
              if (match && match[1]) {
                correctAnswer = match[1].trim();
                console.log("从我的答案后找到正确答案:", correctAnswer);
                foundAnswer = true;
                break;
              }
            }
          }
        }
        
        // 备用方案：检查从"分数"行后面的内容
        if (!foundAnswer) {
          for (let j = 1; j < lines.length; j++) {
            if (lines[j].match(/\d+分/)) {
              // 找到分数行后的下一行
              if (j < lines.length - 1) {
                const nextLine = lines[j+1].trim();
                // 尝试匹配 (1) 开头的行
                const numMatch = nextLine.match(/^\((\d+)\)\s*(.+)$/);
                if (numMatch && numMatch[2]) {
                  correctAnswer = numMatch[2].trim();
                  console.log("从分数行后找到答案:", correctAnswer);
                  foundAnswer = true;
                  break;
                }
              }
            }
          }
        }
      }
      
      // 4. 最后尝试：查找任何包含(1)的行作为答案
      if (!foundAnswer) {
        for (let j = 1; j < lines.length; j++) {
          const line = lines[j].trim();
          // 跳过"我的答案"行
          if (line.match(/我的答案/i)) continue;
          
          const numAnswerMatch = line.match(/\(\d+\)\s*(.+)$/);
          if (numAnswerMatch && numAnswerMatch[1]) {
            correctAnswer = numAnswerMatch[1].trim();
            console.log("匹配到任意(1)行作为答案:", correctAnswer);
            foundAnswer = true;
            break;
          }
        }
      }
      
      if (!correctAnswer) {
        console.log("所有方法都未找到有效答案，跳过此题");
        continue;
      }
      
      // 处理可能有多个正确答案的情况 (分号分隔)
      const multipleAnswers = correctAnswer.split(/[;；]/).map(a => a.trim()).filter(Boolean);
      console.log("处理后的答案列表:", multipleAnswers);
      
      // 创建填空题对象
      const now = Date.now();
      questions.push({
        content: questionContent,
        type: questionType,
        options: [], // 填空题没有选项
        answer: multipleAnswers.length === 1 ? multipleAnswers[0] : multipleAnswers.join(';'), 
        explanation: '',
        tags: [],
        createdAt: now,
        updatedAt: now,
      });
      
      console.log("成功添加填空题");
      continue;
    }
    
    // 其他题型逻辑保持不变
    const parsedOptions: ParsedOption[] = [];
    let correctAnswerLetter: string | null = null;
    
    // 解析选项
    for (let j = 1; j < lines.length; j++) {
      const line = lines[j];
      
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
      
      // 查找答案行
      const answerMatch = line.match(/.*正确答案[:：]\s*([A-Z])(?:[^;]*);?/);
      if (answerMatch) {
        correctAnswerLetter = answerMatch[1];
        break;
      } else if (line.includes('正确答案:对') || line.includes('正确答案:错') || 
                 line.includes('正确答案：对') || line.includes('正确答案：错')) {
        // 处理判断题
        correctAnswerLetter = (line.includes('正确答案:对') || line.includes('正确答案：对')) ? 'A' : 'B';
        // 如果是判断题但还没有选项，自动添加"对错"选项
        if (parsedOptions.length === 0 && questionType === QuestionType.TrueFalse) {
          parsedOptions.push({ id: generateGuid(), content: '对', letter: 'A' });
          parsedOptions.push({ id: generateGuid(), content: '错', letter: 'B' });
        }
        break;
      }
    }
    
    // 验证解析结果
    if (!correctAnswerLetter) {
      console.log("未找到正确答案字母，跳过此题");
      continue;
    }
    
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
    if (parsedOptions.length === 0) {
      console.log("未找到选项，跳过此题");
      continue;
    }
    
    const finalOptions: QuestionOption[] = parsedOptions.map(opt => ({ id: opt.id, content: opt.content }));
    let questionAnswer: string | string[] = '';
    
    if (questionType === QuestionType.MultipleChoice) {
      // 多选题处理（学习通格式可能有多个字母如"A,B,C"）
      const multiAnswers = correctAnswerLetter.split(/[,，、]/);
      questionAnswer = multiAnswers.map(letter => {
        const option = parsedOptions.find(opt => opt.letter === letter.trim());
        return option ? option.id : '';
      }).filter(Boolean);
      
      if (questionAnswer.length === 0) {
        console.log("多选题未找到有效答案选项，跳过");
        continue;
      }
    } else {
      // 单选题和判断题处理
      const correctOption = parsedOptions.find(opt => opt.letter === correctAnswerLetter);
      if (correctOption) {
        questionAnswer = correctOption.id;
      } else {
        console.log("单选题未找到对应选项，跳过");
        continue;
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
    console.log("成功添加其他类型题目");
  }
  
  console.log(`\n总共解析成功 ${questions.length} 道题目`);
  return questions;
}

/**
 * 解析"单选题1"模板的文本，适用于紧凑格式的单选题
 * 例如: "1. 题目内容 A.选项1 B.选项2 C.选项3 参考答案：A"
 * 支持题干和选项混排、选项跨行、A.或A．、参考答案在任意行
 * 采用顺序扫描+状态机，兼容所有混排和跨行情况
 * @param text 原始文本输入
 */
function parseSingleChoice1Template(text: string): Omit<Question, 'id' | 'bankId'>[] {
  const questions: Omit<Question, 'id' | 'bankId'>[] = [];
  if (!text.trim()) return questions;

  enum State { None, Question, Option, Answer }
  let state: State = State.None;

  // 题号正则
  const seqReg = /^\s*(\d+)\./;
  // 选项正则（A. A． 全角/半角）
  const optReg = /^([A-EＡ-Ｅ])[\.．]\s*(.*)$/;
  // 参考答案正则
  const ansReg = /参考答案[:：]?\s*([A-EＡ-Ｅ])/;
  // 行内选项正则（用于题干和选项混排）
  const inlineOptReg = /([A-EＡ-Ｅ])[\.．]\s*([^A-EＡ-Ｅ]*)/g;
  // 工具：全角转半角
  const toHalf = (ch: string) => String.fromCharCode(ch.charCodeAt(0) > 127 ? ch.charCodeAt(0) - 65248 : ch.charCodeAt(0));

  const lines = text.replace(/\r\n/g, '\n').split('\n');

  let bufferQuestion = '';
  let bufferOption = '';
  let bufferOptionLetter = '';
  let bufferOptions: ParsedOption[] = [];
  let bufferAnswer = '';

  function pushQuestion() {
    if (!bufferQuestion.trim() || bufferOptions.length === 0 || !bufferAnswer) return;
    const now = Date.now();
    questions.push({
      content: bufferQuestion.trim(),
      type: QuestionType.SingleChoice,
      options: bufferOptions.filter(opt => !!opt.letter).map(opt => ({ id: opt.letter as string, content: opt.content.trim() })),
      answer: bufferAnswer,
      explanation: '',
      tags: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // 1. 判断是否为新题号
    const seqMatch = line.match(seqReg);
    if (seqMatch) {
      // 如果已有缓存，先保存上一题
      if (bufferQuestion && bufferOptions.length && bufferAnswer) {
        pushQuestion();
      }
      // 重置缓存
      bufferQuestion = '';
      bufferOptions = [];
      bufferOption = '';
      bufferOptionLetter = '';
      bufferAnswer = '';
      state = State.Question;
      // 去掉题号，剩下为题干+选项混合体
      const afterSeq = line.replace(seqReg, '').trim();
      // 检查是否有A.或A．，如有则拆分题干和选项
      const firstOptIdx = afterSeq.search(/([A-EＡ-Ｅ])[\.．]/);
      if (firstOptIdx !== -1) {
        bufferQuestion = afterSeq.substring(0, firstOptIdx).trim();
        const optStr = afterSeq.substring(firstOptIdx);
        // 用全局正则拆分所有选项
        let match;
        let lastLetter = '';
        let lastContent = '';
        let lastIndex = 0;
        let optMatches = Array.from(optStr.matchAll(inlineOptReg));
        for (let j = 0; j < optMatches.length; j++) {
          const m = optMatches[j];
          const letter = toHalf(m[1]);
          const content = m[2].trim();
          // 选项内容为当前匹配到的内容+下一个选项前的所有内容
          let nextStart = j < optMatches.length - 1 ? optMatches[j+1].index : optStr.length;
          let fullContent = optStr.substring(m.index! + m[0].length, nextStart).trim();
          // 合并当前正则捕获和后续内容
          const optionContent = (content + ' ' + fullContent).replace(/\s+/g, ' ').trim();
          bufferOptions.push({
            id: letter,
            letter,
            content: optionContent
          });
        }
        state = State.Option;
        continue;
      } else {
        bufferQuestion = afterSeq;
        continue;
      }
    }

    // 2. 判断是否为选项（新行的B. C. D. E.）
    const optMatch = line.match(optReg);
    if (optMatch) {
      // 如果有上一选项，先保存
      if (bufferOptionLetter) {
        bufferOptions.push({
          id: bufferOptionLetter,
          letter: bufferOptionLetter,
          content: bufferOption.trim(),
        });
      }
      bufferOptionLetter = toHalf(optMatch[1]);
      bufferOption = optMatch[2].trim();
      state = State.Option;
      continue;
    }

    // 3. 判断是否为参考答案
    const ansMatch = line.match(ansReg);
    if (ansMatch) {
      // 保存最后一个选项
      if (bufferOptionLetter) {
        bufferOptions.push({
          id: bufferOptionLetter,
          letter: bufferOptionLetter,
          content: bufferOption.trim(),
        });
        bufferOptionLetter = '';
        bufferOption = '';
      }
      bufferAnswer = toHalf(ansMatch[1]);
      state = State.Answer;
      continue;
    }

    // 4. 追加内容到当前状态
    if (state === State.Question) {
      bufferQuestion += ' ' + line;
    } else if (state === State.Option) {
      bufferOption += ' ' + line;
    }
    // 答案状态下的内容忽略
  }
  // 处理最后一题
  if (bufferQuestion && bufferOptions.length && bufferAnswer) {
    pushQuestion();
  }
  return questions;
} 