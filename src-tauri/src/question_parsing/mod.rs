use crate::quiz::{Question, QuestionOption};
use serde_json::Value;
use std::time::{SystemTime, UNIX_EPOCH};

const SINGLE_CHOICE: &str = "single-choice";
const MULTIPLE_CHOICE: &str = "multiple-choice";
const TRUE_FALSE: &str = "true-false";
const SHORT_ANSWER: &str = "short-answer";
const FILL_IN_BLANK: &str = "fill-in-blank";

fn now_millis() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64
}

fn generated_id(prefix: &str, question_index: usize, item_index: usize) -> String {
    format!(
        "{}-{}-{}-{}",
        prefix,
        now_millis(),
        question_index,
        item_index
    )
}

fn make_question(
    index: usize,
    question_type: &str,
    content: String,
    options: Vec<QuestionOption>,
    answer: Value,
    explanation: String,
) -> Question {
    let now = now_millis();
    Question {
        id: generated_id("question", index, 0),
        question_type: question_type.to_string(),
        content,
        options: Some(options),
        answer,
        explanation: Some(explanation),
        tags: Some(Vec::new()),
        created_at: now,
        updated_at: now,
    }
}

fn split_question_blocks(text: &str) -> Vec<String> {
    let mut blocks = Vec::new();
    let mut current = Vec::new();

    for line in text.replace("\r\n", "\n").lines() {
        if line.trim().is_empty() {
            if !current.is_empty() {
                blocks.push(current.join("\n"));
                current.clear();
            }
        } else {
            current.push(line.to_string());
        }
    }

    if !current.is_empty() {
        blocks.push(current.join("\n"));
    }

    blocks
}

fn trimmed_lines(block: &str) -> Vec<String> {
    block
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
        .map(ToString::to_string)
        .collect()
}

fn answer_payload(line: &str) -> Option<String> {
    let lower = line.to_lowercase();
    if lower.starts_with("answer:") {
        return Some(line[7..].trim().to_string());
    }
    if let Some(rest) = line
        .strip_prefix("答案：")
        .or_else(|| line.strip_prefix("答案:"))
    {
        return Some(rest.trim().to_string());
    }
    None
}

fn explanation_payload(line: &str) -> Option<String> {
    let lower = line.to_lowercase();
    if lower.starts_with("explanation:") {
        return Some(line[12..].trim().to_string());
    }
    if let Some(rest) = line
        .strip_prefix("解析：")
        .or_else(|| line.strip_prefix("解析:"))
    {
        return Some(rest.trim().to_string());
    }
    None
}

fn correct_answer_payload(line: &str) -> Option<String> {
    let lower = line.to_lowercase();
    if let Some(pos) = lower.find("correct answer") {
        return Some(
            line[pos + "correct answer".len()..]
                .trim_start_matches([':', '：', ' '])
                .trim()
                .strip_suffix(';')
                .unwrap_or_else(|| {
                    line[pos + "correct answer".len()..]
                        .trim_start_matches([':', '：', ' '])
                        .trim()
                })
                .to_string(),
        );
    }
    if let Some(pos) = line.find("正确答案") {
        return Some(
            line[pos + "正确答案".len()..]
                .trim_start_matches([':', '：', ' '])
                .trim()
                .trim_end_matches([';', '；'])
                .to_string(),
        );
    }
    if let Some(pos) = line.find("参考答案") {
        return Some(
            line[pos + "参考答案".len()..]
                .trim_start_matches([':', '：', ' '])
                .trim()
                .trim_end_matches([';', '；'])
                .to_string(),
        );
    }
    None
}

fn strip_question_prefix(line: &str, chinese: &str, english: &[&str]) -> Option<String> {
    if let Some(rest) = line.strip_prefix(chinese) {
        return Some(rest.trim().to_string());
    }
    let lower = line.to_lowercase();
    for prefix in english {
        if lower.starts_with(prefix) {
            return Some(line[prefix.len()..].trim().to_string());
        }
    }
    None
}

fn option_marker(line: &str) -> Option<(String, String)> {
    let mut chars = line.chars();
    let first = chars.next()?;
    if !first.is_ascii_alphabetic() {
        return None;
    }
    let second = chars.next()?;
    if second != '.' && second != '．' {
        return None;
    }
    Some((
        first.to_ascii_uppercase().to_string(),
        chars.as_str().trim().to_string(),
    ))
}

fn parse_options(lines: &[String], start_index: usize) -> Vec<QuestionOption> {
    let mut options = Vec::new();
    let mut current: Option<QuestionOption> = None;

    for line in lines.iter().skip(start_index) {
        if answer_payload(line).is_some() || explanation_payload(line).is_some() {
            if let Some(option) = current.take() {
                options.push(option);
            }
            break;
        }

        if let Some((id, content)) = option_marker(line) {
            if let Some(option) = current.take() {
                options.push(option);
            }
            current = Some(QuestionOption { id, content });
        } else if let Some(option) = current.as_mut() {
            option.content.push('\n');
            option.content.push_str(line);
        }
    }

    if let Some(option) = current {
        options.push(option);
    }

    options
}

fn answer_letters(answer: &str) -> Vec<String> {
    answer
        .chars()
        .filter_map(|ch| {
            let normalized = to_half_width(ch).to_ascii_uppercase();
            normalized
                .is_ascii_alphabetic()
                .then(|| normalized.to_string())
        })
        .collect()
}

fn find_choice_answer(lines: &[String], options: &[QuestionOption], question_type: &str) -> Value {
    let Some(answer_text) = lines.iter().find_map(|line| answer_payload(line)) else {
        return Value::String(String::new());
    };

    let letters = answer_letters(&answer_text);
    if question_type == MULTIPLE_CHOICE {
        let values = letters
            .iter()
            .filter_map(|letter| {
                options
                    .iter()
                    .find(|option| option.id == *letter)
                    .map(|option| Value::String(option.id.clone()))
                    .or_else(|| Some(Value::String(letter.clone())))
            })
            .collect();
        return Value::Array(values);
    }

    letters
        .first()
        .and_then(|letter| {
            options
                .iter()
                .find(|option| option.id == *letter)
                .map(|option| option.id.clone())
                .or_else(|| Some(letter.clone()))
        })
        .map(Value::String)
        .unwrap_or_else(|| Value::String(String::new()))
}

fn true_false_answer_from_text(answer: &str) -> String {
    let normalized = answer.trim().to_lowercase();
    if ["对", "正确", "true", "correct"].contains(&normalized.as_str()) {
        "true".to_string()
    } else if ["错", "错误", "false", "incorrect"].contains(&normalized.as_str()) {
        "false".to_string()
    } else {
        String::new()
    }
}

fn find_true_false_answer(lines: &[String]) -> Value {
    lines
        .iter()
        .find_map(|line| answer_payload(line))
        .map(|answer| true_false_answer_from_text(&answer))
        .map(Value::String)
        .unwrap_or_else(|| Value::String(String::new()))
}

fn has_choice_options(lines: &[String]) -> bool {
    lines.iter().any(|line| option_marker(line).is_some())
}

fn classify_ai_block(lines: &[String]) -> (String, String, usize) {
    let first = lines.first().cloned().unwrap_or_default();

    if let Some(content) = strip_question_prefix(&first, "单选题：", &["single choice:"]) {
        return (SINGLE_CHOICE.to_string(), content, 1);
    }
    if let Some(content) = strip_question_prefix(&first, "多选题：", &["multiple choice:"]) {
        return (MULTIPLE_CHOICE.to_string(), content, 1);
    }
    if let Some(content) =
        strip_question_prefix(&first, "判断题：", &["true/false:", "true-false:"])
    {
        return (TRUE_FALSE.to_string(), content, 1);
    }
    if let Some(content) = strip_question_prefix(&first, "简答题：", &["short answer:"]) {
        return (SHORT_ANSWER.to_string(), content, 1);
    }
    if let Some(mut content) = strip_question_prefix(
        &first,
        "填空题：",
        &["fill in the blank:", "fill in blank:"],
    ) {
        if !content.contains("____") {
            content = replace_parenthesized_with_blank(&content);
        }
        return (FILL_IN_BLANK.to_string(), content, 1);
    }

    let answer = lines.iter().find_map(|line| answer_payload(line));
    let question_type = if first.contains("____") {
        FILL_IN_BLANK
    } else if has_choice_options(lines) {
        if answer
            .as_ref()
            .is_some_and(|value| value.contains(',') || value.contains('，'))
        {
            MULTIPLE_CHOICE
        } else {
            SINGLE_CHOICE
        }
    } else if answer
        .as_ref()
        .is_some_and(|value| !true_false_answer_from_text(value).is_empty())
    {
        TRUE_FALSE
    } else {
        SHORT_ANSWER
    };

    (question_type.to_string(), first, 0)
}

fn replace_parenthesized_with_blank(text: &str) -> String {
    let mut out = String::new();
    let mut depth = 0;
    for ch in text.chars() {
        match ch {
            '(' if depth == 0 => {
                out.push_str("____");
                depth = 1;
            }
            '(' => depth += 1,
            ')' if depth > 0 => depth -= 1,
            _ if depth == 0 => out.push(ch),
            _ => {}
        }
    }
    out
}

fn parse_ai_questions_inner(text: &str) -> Vec<Question> {
    split_question_blocks(text)
        .iter()
        .enumerate()
        .filter_map(|(index, block)| {
            let lines = trimmed_lines(block);
            if lines.len() < 2 {
                return None;
            }

            let (question_type, content, option_start) = classify_ai_block(&lines);
            let options = if question_type == SINGLE_CHOICE || question_type == MULTIPLE_CHOICE {
                parse_options(&lines, option_start)
            } else {
                Vec::new()
            };

            let answer = match question_type.as_str() {
                SINGLE_CHOICE | MULTIPLE_CHOICE => {
                    find_choice_answer(&lines, &options, &question_type)
                }
                TRUE_FALSE => find_true_false_answer(&lines),
                _ => lines
                    .iter()
                    .find_map(|line| answer_payload(line))
                    .map(Value::String)
                    .unwrap_or_else(|| Value::String(String::new())),
            };
            let explanation = lines
                .iter()
                .find_map(|line| explanation_payload(line))
                .unwrap_or_default();

            Some(make_question(
                index,
                &question_type,
                content,
                options,
                answer,
                explanation,
            ))
        })
        .collect()
}

fn parse_numbered_content(line: &str) -> Option<String> {
    let trimmed = line.trim();
    let dot = trimmed.find('.')?;
    if trimmed[..dot].trim().chars().all(|ch| ch.is_ascii_digit()) {
        Some(trimmed[dot + 1..].trim().to_string())
    } else {
        None
    }
}

fn parse_other_template(text: &str) -> Vec<Question> {
    split_question_blocks(text)
        .iter()
        .enumerate()
        .filter_map(|(index, block)| {
            let lines = trimmed_lines(block);
            if lines.len() < 3 {
                return None;
            }

            let content = parse_numbered_content(&lines[0])
                .map(|value| value.trim_end_matches("()").trim().to_string())
                .unwrap_or_else(|| lines[0].clone());

            let mut parsed_options = Vec::new();
            let mut correct_letter = None;
            for (line_index, line) in lines.iter().enumerate().skip(1) {
                if let Some((letter, content)) = option_marker(line) {
                    parsed_options.push((
                        letter,
                        QuestionOption {
                            id: generated_id("option", index, line_index),
                            content,
                        },
                    ));
                    continue;
                }
                if let Some(answer) = correct_answer_payload(line) {
                    correct_letter = answer_letters(&answer).first().cloned();
                    break;
                }
            }

            let correct_letter = correct_letter?;
            let answer_id = parsed_options
                .iter()
                .find(|(letter, _)| *letter == correct_letter)
                .map(|(_, option)| option.id.clone())?;
            let options = parsed_options
                .into_iter()
                .map(|(_, option)| option)
                .collect::<Vec<_>>();

            Some(make_question(
                index,
                SINGLE_CHOICE,
                content,
                options,
                Value::String(answer_id),
                String::new(),
            ))
        })
        .collect()
}

fn split_numbered_blocks(text: &str) -> Vec<String> {
    let mut blocks = Vec::new();
    let mut current = Vec::new();

    for line in text.replace("\r\n", "\n").lines() {
        let trimmed = line.trim();
        let is_new_question = parse_numbered_content(trimmed).is_some();
        if is_new_question && !current.is_empty() {
            blocks.push(current.join("\n"));
            current.clear();
        }
        if !trimmed.is_empty() {
            current.push(trimmed.to_string());
        }
    }
    if !current.is_empty() {
        blocks.push(current.join("\n"));
    }
    blocks
}

fn parse_chaoxing_header(line: &str) -> (String, String) {
    let after_number = parse_numbered_content(line).unwrap_or_else(|| line.to_string());
    let trimmed = after_number.trim();
    if let Some(rest) = trimmed.strip_prefix('(') {
        if let Some(end) = rest.find(')') {
            return (
                rest[..end].trim().to_lowercase(),
                rest[end + 1..].trim().to_string(),
            );
        }
    }
    (String::new(), trimmed.to_string())
}

fn infer_chaoxing_type(type_text: &str, content: &str, lines: &[String]) -> &'static str {
    if type_text.contains("填空") || type_text.contains("blank") {
        return FILL_IN_BLANK;
    }
    if type_text.contains("单选") || type_text.contains("single") {
        return SINGLE_CHOICE;
    }
    if type_text.contains("多选") || type_text.contains("multiple") {
        return MULTIPLE_CHOICE;
    }
    if type_text.contains("判断") || type_text.contains("true") || type_text.contains("false") {
        return TRUE_FALSE;
    }

    let answer = lines.iter().find_map(|line| correct_answer_payload(line));
    if content.contains("____") {
        FILL_IN_BLANK
    } else if answer
        .as_ref()
        .is_some_and(|value| value.contains('，') || value.contains(',') || value.contains('、'))
    {
        MULTIPLE_CHOICE
    } else if answer
        .as_ref()
        .is_some_and(|value| !true_false_answer_from_text(value).is_empty())
    {
        TRUE_FALSE
    } else {
        SINGLE_CHOICE
    }
}

fn is_meta_line(line: &str) -> bool {
    let lower = line.to_lowercase();
    lower.contains("my answer")
        || lower.contains("correct answer")
        || line.contains("我的答案")
        || line.contains("正确答案")
        || line.contains("参考答案")
        || line.contains('分')
        || lower.contains("score")
}

fn parse_chaoxing_template(text: &str) -> Vec<Question> {
    split_numbered_blocks(text)
        .iter()
        .enumerate()
        .filter_map(|(index, block)| {
            let lines = trimmed_lines(block);
            if lines.len() < 2 {
                return None;
            }

            let (type_text, mut content) = parse_chaoxing_header(&lines[0]);
            for line in lines.iter().skip(1) {
                if option_marker(line).is_some() || is_meta_line(line) {
                    break;
                }
                content.push('\n');
                content.push_str(line);
            }

            let question_type = infer_chaoxing_type(&type_text, &content, &lines);
            if question_type == FILL_IN_BLANK {
                let answer = lines
                    .iter()
                    .find_map(|line| correct_answer_payload(line))
                    .map(|value| value.replace('；', ";"))
                    .unwrap_or_default();
                return Some(make_question(
                    index,
                    question_type,
                    content,
                    Vec::new(),
                    Value::String(answer),
                    String::new(),
                ));
            }

            let mut options = Vec::new();
            let mut letter_to_id = Vec::new();
            for (line_index, line) in lines.iter().enumerate().skip(1) {
                if let Some((letter, content)) = option_marker(line) {
                    let option = QuestionOption {
                        id: generated_id("option", index, line_index),
                        content,
                    };
                    letter_to_id.push((letter, option.id.clone()));
                    options.push(option);
                }
            }

            if question_type == TRUE_FALSE && options.is_empty() {
                let true_id = generated_id("option", index, 1);
                let false_id = generated_id("option", index, 2);
                letter_to_id.push(("A".to_string(), true_id.clone()));
                letter_to_id.push(("B".to_string(), false_id.clone()));
                options.push(QuestionOption {
                    id: true_id,
                    content: "对/True".to_string(),
                });
                options.push(QuestionOption {
                    id: false_id,
                    content: "错/False".to_string(),
                });
            }

            if options.is_empty() {
                return None;
            }

            let answer_text = lines
                .iter()
                .find_map(|line| correct_answer_payload(line))
                .unwrap_or_default();
            let answer = if question_type == TRUE_FALSE {
                let letter = if true_false_answer_from_text(&answer_text) == "true" {
                    "A"
                } else {
                    "B"
                };
                Value::String(
                    letter_to_id
                        .iter()
                        .find(|(option_letter, _)| option_letter == letter)
                        .map(|(_, id)| id.clone())
                        .unwrap_or_default(),
                )
            } else if question_type == MULTIPLE_CHOICE {
                Value::Array(
                    answer_letters(&answer_text)
                        .iter()
                        .filter_map(|letter| {
                            letter_to_id
                                .iter()
                                .find(|(option_letter, _)| option_letter == letter)
                                .map(|(_, id)| Value::String(id.clone()))
                        })
                        .collect(),
                )
            } else {
                let letter = answer_letters(&answer_text)
                    .first()
                    .cloned()
                    .unwrap_or_default();
                Value::String(
                    letter_to_id
                        .iter()
                        .find(|(option_letter, _)| *option_letter == letter)
                        .map(|(_, id)| id.clone())
                        .unwrap_or_default(),
                )
            };

            Some(make_question(
                index,
                question_type,
                content,
                options,
                answer,
                String::new(),
            ))
        })
        .collect()
}

fn to_half_width(ch: char) -> char {
    match ch {
        'Ａ'..='Ｅ' => char::from_u32(ch as u32 - 65248).unwrap_or(ch),
        _ => ch,
    }
}

fn find_option_marker(text: &str, start: usize) -> Option<(usize, String)> {
    let chars = text.char_indices().collect::<Vec<_>>();
    for window in chars.windows(2).skip_while(|window| window[0].0 < start) {
        let letter = to_half_width(window[0].1);
        let mark = window[1].1;
        if matches!(letter, 'A'..='E') && (mark == '.' || mark == '．') {
            return Some((window[0].0, letter.to_string()));
        }
    }
    None
}

fn parse_inline_options(text: &str) -> Vec<QuestionOption> {
    let mut options = Vec::new();
    let mut cursor = 0;
    while let Some((marker_index, letter)) = find_option_marker(text, cursor) {
        let after_marker = marker_index
            + text[marker_index..]
                .chars()
                .take(2)
                .map(char::len_utf8)
                .sum::<usize>();
        let next_marker = find_option_marker(text, after_marker).map(|(idx, _)| idx);
        let content_end = next_marker.unwrap_or(text.len());
        let content = text[after_marker..content_end].trim();
        if !content.is_empty() {
            options.push(QuestionOption {
                id: letter,
                content: content.to_string(),
            });
        }
        cursor = content_end;
    }
    options
}

fn parse_single_choice1_template(text: &str) -> Vec<Question> {
    split_numbered_blocks(text)
        .iter()
        .enumerate()
        .filter_map(|(index, block)| {
            let lines = trimmed_lines(block);
            let first_line = lines.first()?;
            let after_number = parse_numbered_content(first_line)?;
            let first_option_index = find_option_marker(&after_number, 0).map(|(idx, _)| idx)?;
            let content = after_number[..first_option_index].trim().to_string();
            let mut option_text = after_number[first_option_index..].to_string();
            for line in lines.iter().skip(1) {
                if correct_answer_payload(line).is_none() {
                    option_text.push(' ');
                    option_text.push_str(line);
                }
            }
            let options = parse_inline_options(&option_text);
            let answer = lines
                .iter()
                .find_map(|line| correct_answer_payload(line))
                .and_then(|value| answer_letters(&value).first().cloned())?;
            if content.is_empty() || options.is_empty() {
                return None;
            }
            Some(make_question(
                index,
                SINGLE_CHOICE,
                content,
                options,
                Value::String(answer),
                String::new(),
            ))
        })
        .collect()
}

#[tauri::command]
pub async fn parse_questions(text: String) -> Result<Vec<Question>, String> {
    Ok(parse_ai_questions_inner(&text))
}

#[tauri::command]
pub async fn parse_text_by_script(text: String, template: String) -> Result<Vec<Question>, String> {
    let questions = match template.as_str() {
        "chaoxing" => parse_chaoxing_template(&text),
        "singlechoice1" => parse_single_choice1_template(&text),
        _ => parse_other_template(&text),
    };
    Ok(questions)
}

#[cfg(test)]
mod tests;
