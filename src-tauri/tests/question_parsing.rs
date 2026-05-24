use app_lib::question_parsing::{parse_questions, parse_text_by_script};
use serde_json::Value;

#[tokio::test]
async fn parses_ai_single_choice() {
    let questions = parse_questions(
        "Single choice: Which option is correct?\nA. Alpha\nB. Beta\nAnswer: B\nExplanation: Beta is expected."
            .to_string(),
    )
    .await
    .expect("AI questions should parse");

    assert_eq!(questions.len(), 1);
    assert_eq!(questions[0].question_type, "single-choice");
    assert_eq!(questions[0].answer, Value::String("B".to_string()));
    assert_eq!(questions[0].options.as_ref().unwrap()[1].content, "Beta");
}

#[tokio::test]
async fn parses_ai_blank_and_true_false() {
    let questions = parse_questions(
        "Fill in the blank: The runtime is (Node.js).\nAnswer: Node.js\n\n判断题：太阳从西方升起\n答案：错误"
            .to_string(),
    )
    .await
    .expect("AI questions should parse");

    assert_eq!(questions.len(), 2);
    assert_eq!(questions[0].question_type, "fill-in-blank");
    assert_eq!(questions[0].content, "The runtime is ____.");
    assert_eq!(questions[0].answer, Value::String("Node.js".to_string()));
    assert_eq!(questions[1].question_type, "true-false");
    assert_eq!(questions[1].answer, Value::String("false".to_string()));
}

#[tokio::test]
async fn parses_chaoxing_choice_and_blank() {
    let questions = parse_text_by_script(
        "1. (多选题) 选择项目技术\nA. Next.js\nB. Tauri\nC. Photoshop\n正确答案：A，B\n\n2. (填空题) 包管理器是____\n正确答案：pnpm；npm"
            .to_string(),
        "chaoxing".to_string(),
    )
    .await
    .expect("chaoxing questions should parse");

    assert_eq!(questions.len(), 2);
    assert_eq!(questions[0].question_type, "multiple-choice");
    assert_eq!(questions[1].answer, Value::String("pnpm;npm".to_string()));
}

#[tokio::test]
async fn parses_compact_single_choice() {
    let questions = parse_text_by_script(
        "1. 哪个框架用于桌面壳？Ａ．Electron Ｂ．Tauri\n参考答案：Ｂ".to_string(),
        "singlechoice1".to_string(),
    )
    .await
    .expect("compact single choice questions should parse");

    assert_eq!(questions.len(), 1);
    assert_eq!(questions[0].content, "哪个框架用于桌面壳？");
    assert_eq!(questions[0].answer, Value::String("B".to_string()));
}
