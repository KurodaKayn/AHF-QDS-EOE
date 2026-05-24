use super::*;

#[test]
fn parses_ai_single_choice() {
    let questions = parse_ai_questions_inner(
        "Single choice: Which option is correct?\nA. Alpha\nB. Beta\nAnswer: B\nExplanation: Beta is expected.",
    );

    assert_eq!(questions.len(), 1);
    assert_eq!(questions[0].question_type, SINGLE_CHOICE);
    assert_eq!(questions[0].answer, Value::String("B".to_string()));
    assert_eq!(questions[0].options.as_ref().unwrap()[1].content, "Beta");
}

#[test]
fn parses_ai_blank_and_true_false() {
    let questions = parse_ai_questions_inner(
        "Fill in the blank: The runtime is (Node.js).\nAnswer: Node.js\n\n判断题：太阳从西方升起\n答案：错误",
    );

    assert_eq!(questions.len(), 2);
    assert_eq!(questions[0].question_type, FILL_IN_BLANK);
    assert_eq!(questions[0].content, "The runtime is ____.");
    assert_eq!(questions[0].answer, Value::String("Node.js".to_string()));
    assert_eq!(questions[1].question_type, TRUE_FALSE);
    assert_eq!(questions[1].answer, Value::String("false".to_string()));
}

#[test]
fn parses_chaoxing_choice_and_blank() {
    let questions = parse_chaoxing_template(
        "1. (多选题) 选择项目技术\nA. Next.js\nB. Tauri\nC. Photoshop\n正确答案：A，B\n\n2. (填空题) 包管理器是____\n正确答案：pnpm；npm",
    );

    assert_eq!(questions.len(), 2);
    assert_eq!(questions[0].question_type, MULTIPLE_CHOICE);
    assert_eq!(questions[1].answer, Value::String("pnpm;npm".to_string()));
}

#[test]
fn parses_compact_single_choice() {
    let questions = parse_single_choice1_template(
        "1. 哪个框架用于桌面壳？Ａ．Electron Ｂ．Tauri\n参考答案：Ｂ",
    );

    assert_eq!(questions.len(), 1);
    assert_eq!(questions[0].content, "哪个框架用于桌面壳？");
    assert_eq!(questions[0].answer, Value::String("B".to_string()));
}
