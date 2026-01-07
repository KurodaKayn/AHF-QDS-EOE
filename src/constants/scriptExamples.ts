import { ScriptTemplate } from "@/utils/scriptParser";

/**
 * 脚本模板示例文本
 */
export const SCRIPT_EXAMPLES: Record<ScriptTemplate, string> = {
  [ScriptTemplate.ChaoXing]: `1. (单选题)以下选项中，哪一个是JavaScript的基本数据类型?
A. Array
B. Object
C. Number
D. Function
正确答案:C

2. (多选题)以下哪些是JavaScript框架或库?
A. React
B. Vue
C. Python
D. Angular
正确答案:A,B,D

3. (判断题)HTML是一种编程语言。
正确答案:错误

4. (填空题)CSS选择器中，____ 用于选择类，而 ____ 用于选择ID。
正确答案:(1) .;(2) #`,

  [ScriptTemplate.SingleChoice1]: `1. 关于上颌第一磨牙髓腔形态的描述不正确的是A.髓室颊舌中径大于近远中径且大于髓室高度B.髓室顶形凹，最凹处约接近牙冠中1／3 
C.近颊髓角和近舌髓角均接近牙冠中l／3 
D.远颊髓角和远舌髓角均接近牙冠顶l／3 
E.近颊根管为双管型或单双管型者共占63%
参考答案：B

2. 汇合形成面后静脉的是A．面前静脉，颞浅静脉
B．颞浅静脉，领内静脉
C．翼静脉丛，颌内静脉
D．面前静脉，耳后静脉
E．翼静脉丛，耳后静脉
参考答案：B`,

  [ScriptTemplate.Other]: `1. 以下哪个不是 JavaScript 基本数据类型?( )
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
正确答案:D:jsp:include;`,
};

/**
 * 获取模板示例标题
 */
export const getScriptExampleTitle = (template: ScriptTemplate): string => {
  const titles: Record<ScriptTemplate, string> = {
    [ScriptTemplate.ChaoXing]: "学习通模板示例",
    [ScriptTemplate.SingleChoice1]: "单选题1模板示例",
    [ScriptTemplate.Other]: "其它模板示例",
  };
  return titles[template];
};
