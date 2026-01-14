import { ScriptTemplate } from "@/utils/scriptParser";

/**
 * Script template example texts (Chinese)
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
 * Script template example texts (English)
 */
export const SCRIPT_EXAMPLES_EN: Record<ScriptTemplate, string> = {
  [ScriptTemplate.ChaoXing]: `1. (Single Choice) Which of the following is a primitive data type in JavaScript?
A. Array
B. Object
C. Number
D. Function
Correct Answer: C

2. (Multiple Choice) Which of the following are JavaScript frameworks or libraries?
A. React
B. Vue
C. Python
D. Angular
Correct Answer: A,B,D

3. (True-False) HTML is a programming language.
Correct Answer: False

4. (Fill-in-Blank) In CSS selectors, ____ is used to select classes, while ____ is used to select IDs.
Correct Answer: (1) .; (2) #`,

  [ScriptTemplate.SingleChoice1]: `1. Which description of the maxillary first molar pulp cavity is incorrect? A. The bucco-lingual diameter is larger than the mesio-distal diameter and the pulp chamber height. B. The pulp chamber roof is concave.
C. Mesio-buccal and mesio-lingual pulp horns are close to the middle 1/3 of the crown.
D. Disto-buccal and disto-lingual pulp horns are close to the cervical 1/3 of the crown.
E. 63% are double or single-double canal types.
Reference Answer: B

2. Which veins merge to form the retromandibular vein? A. Facial vein, superficial temporal vein.
B. Superficial temporal vein, maxillary vein.
C. Pterygoid plexus, maxillary vein.
D. Facial vein, posterior auricular vein.
E. Pterygoid plexus, posterior auricular vein.
Reference Answer: B`,

  [ScriptTemplate.Other]: `1. Which of the following is NOT a primitive data type in JavaScript? ( )
A. String
B. Number
C. Array
D. Boolean
Correct Answer: C:Array;

2. Which JSP action tag is used to dynamically include another JSP page? ( )
A. jsp:forward
B. jsp:useBean
C. jsp:setProperty
D. jsp:include
Correct Answer: D:jsp:include;`,
};

/**
 * Gets the example content based on current language
 */
export const getScriptExampleContent = (
  template: ScriptTemplate,
  lang: string = "zh"
): string => {
  return lang.startsWith("en")
    ? SCRIPT_EXAMPLES_EN[template]
    : SCRIPT_EXAMPLES[template];
};

/**
 * Gets the template example title
 */
export const getScriptExampleTitle = (
  template: ScriptTemplate,
  t: any
): string => {
  return t(`convert.examples.${template}`);
};
