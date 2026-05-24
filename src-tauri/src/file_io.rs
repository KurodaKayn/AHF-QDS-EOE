use calamine::{open_workbook_auto_from_rs, Reader};
use csv::{ReaderBuilder, WriterBuilder};
use rust_xlsxwriter::{Workbook, XlsxError};
use serde::{Deserialize, Serialize};
use std::io::Cursor;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuestionOption {
    pub id: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Question {
    pub id: String,
    #[serde(rename = "type")]
    pub question_type: String,
    pub content: String,
    pub options: Option<Vec<QuestionOption>>,
    pub answer: serde_json::Value,
    pub explanation: Option<String>,
    pub tags: Option<Vec<String>>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuestionBank {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub questions: Vec<Question>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportRequest {
    pub bytes: Vec<u8>,
    pub format: String,
    pub bank_name: Option<String>,
    pub file_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportRequest {
    pub bank: QuestionBank,
    pub format: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportResponse {
    pub bytes: Vec<u8>,
    pub file_name: String,
}

fn now_millis() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64
}

fn generate_id(prefix: &str, index: usize) -> String {
    format!("{}-{}-{}", prefix, now_millis(), index)
}

fn parse_multiple_choice_answer(answer: &str) -> Vec<String> {
    answer
        .replace(['"', '\''], "")
        .split(',')
        .map(|part| part.trim().to_string())
        .filter(|part| !part.is_empty())
        .collect()
}

fn normalize_true_false(answer: &str) -> String {
    let answer_text = answer.trim().to_lowercase();
    if ["true", "t", "1", "正确", "对", "yes", "y", "√"].contains(&answer_text.as_str()) {
        "true".to_string()
    } else if ["false", "f", "0", "错误", "错", "no", "n", "×"].contains(&answer_text.as_str())
    {
        "false".to_string()
    } else {
        answer_text
    }
}

fn parse_question_row(headers: &[String], row: &[String], index: usize) -> Option<Question> {
    let get = |name: &str| {
        headers
            .iter()
            .position(|header| header.eq_ignore_ascii_case(name))
            .and_then(|idx| row.get(idx))
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty())
    };

    let question_type = get("type")?;
    let content = get("content")?;
    let answer_raw = get("answer").unwrap_or_default();
    let explanation = get("explanation");
    let tags = get("tags").map(|value| {
        value
            .split(',')
            .map(|tag| tag.trim().to_string())
            .filter(|tag| !tag.is_empty())
            .collect::<Vec<_>>()
    });

    let mut options = Vec::new();
    for letter in 'A'..='Z' {
        let key = format!("option{}", letter);
        if let Some(content) = get(&key) {
            options.push(QuestionOption {
                id: letter.to_string(),
                content,
            });
        }
    }

    let answer = if question_type == "multiple-choice" {
        serde_json::json!(parse_multiple_choice_answer(&answer_raw))
    } else if question_type == "true-false" {
        serde_json::json!(normalize_true_false(&answer_raw))
    } else {
        serde_json::json!(answer_raw)
    };

    let now = now_millis();
    Some(Question {
        id: generate_id("question", index),
        question_type,
        content,
        options: if options.is_empty() {
            None
        } else {
            Some(options)
        },
        answer,
        explanation,
        tags: tags.filter(|list| !list.is_empty()),
        created_at: now,
        updated_at: now,
    })
}

fn export_row(
    question: &Question,
    max_options: usize,
) -> serde_json::Map<String, serde_json::Value> {
    let mut row = serde_json::Map::new();
    row.insert(
        "type".to_string(),
        serde_json::json!(question.question_type),
    );
    row.insert("content".to_string(), serde_json::json!(question.content));
    row.insert(
        "answer".to_string(),
        match &question.answer {
            serde_json::Value::Array(values) => serde_json::json!(values
                .iter()
                .filter_map(|value| value.as_str())
                .collect::<Vec<_>>()
                .join(",")),
            serde_json::Value::String(value) => serde_json::json!(value),
            value => serde_json::json!(value.to_string()),
        },
    );
    row.insert(
        "explanation".to_string(),
        serde_json::json!(question.explanation.clone().unwrap_or_default()),
    );
    row.insert(
        "tags".to_string(),
        serde_json::json!(question.tags.clone().unwrap_or_default().join(",")),
    );

    for index in 0..max_options {
        let key = format!("option{}", (b'A' + index as u8) as char);
        let value = question
            .options
            .as_ref()
            .and_then(|options| options.get(index))
            .map(|option| option.content.clone())
            .unwrap_or_default();
        row.insert(key, serde_json::json!(value));
    }

    row
}

fn csv_headers(max_options: usize) -> Vec<String> {
    let mut headers = vec![
        "type".to_string(),
        "content".to_string(),
        "answer".to_string(),
        "explanation".to_string(),
        "tags".to_string(),
    ];

    for index in 0..max_options {
        headers.push(format!("option{}", (b'A' + index as u8) as char));
    }

    headers
}

fn infer_bank_name(file_name: Option<String>, bank_name: Option<String>) -> String {
    bank_name
        .and_then(|value| {
            if value.trim().is_empty() {
                None
            } else {
                Some(value)
            }
        })
        .or_else(|| {
            file_name.map(|value| {
                value
                    .trim()
                    .trim_end_matches(".csv")
                    .trim_end_matches(".xlsx")
                    .trim_end_matches(".xls")
                    .to_string()
            })
        })
        .unwrap_or_else(|| "Imported Bank".to_string())
}

#[tauri::command]
pub async fn import_question_bank_from_bytes(
    request: ImportRequest,
) -> Result<QuestionBank, String> {
    let bank_name = infer_bank_name(request.file_name.clone(), request.bank_name.clone());
    let format = request.format.to_lowercase();
    let now = now_millis();

    if format == "csv" {
        let csv_text = String::from_utf8(request.bytes).map_err(|error| error.to_string())?;
        let mut reader = ReaderBuilder::new()
            .has_headers(true)
            .from_reader(csv_text.as_bytes());
        let headers = reader
            .headers()
            .map_err(|error| error.to_string())?
            .iter()
            .map(|value| value.to_string())
            .collect::<Vec<_>>();

        let mut questions = Vec::new();
        for (index, result) in reader.records().enumerate() {
            let record = result.map_err(|error| error.to_string())?;
            let row = record
                .iter()
                .map(|value| value.to_string())
                .collect::<Vec<_>>();
            if let Some(question) = parse_question_row(&headers, &row, index) {
                questions.push(question);
            }
        }

        return Ok(QuestionBank {
            id: generate_id("bank", 0),
            name: bank_name,
            description: None,
            questions,
            created_at: now,
            updated_at: now,
        });
    }

    let cursor = Cursor::new(request.bytes);
    let mut workbook = open_workbook_auto_from_rs(cursor).map_err(|error| error.to_string())?;
    let range = workbook
        .worksheets()
        .into_iter()
        .next()
        .ok_or_else(|| "Workbook is empty".to_string())?
        .1;

    let mut rows = range.rows();
    let headers = rows
        .next()
        .ok_or_else(|| "Worksheet is empty".to_string())?
        .iter()
        .map(|cell| cell.to_string())
        .collect::<Vec<_>>();

    let mut questions = Vec::new();
    for (index, row) in rows.enumerate() {
        let values = row.iter().map(|cell| cell.to_string()).collect::<Vec<_>>();
        if let Some(question) = parse_question_row(&headers, &values, index) {
            questions.push(question);
        }
    }

    Ok(QuestionBank {
        id: generate_id("bank", 0),
        name: bank_name,
        description: None,
        questions,
        created_at: now,
        updated_at: now,
    })
}

#[tauri::command]
pub async fn export_question_bank_to_bytes(
    request: ExportRequest,
) -> Result<ExportResponse, String> {
    let max_options = request
        .bank
        .questions
        .iter()
        .map(|question| {
            question
                .options
                .as_ref()
                .map(|options| options.len())
                .unwrap_or(0)
        })
        .max()
        .unwrap_or(0)
        .max(4);
    let headers = csv_headers(max_options);
    let file_name = format!(
        "{}.{}",
        if request.bank.name.trim().is_empty() {
            "quiz_export"
        } else {
            &request.bank.name
        },
        if request.format.eq_ignore_ascii_case("csv") {
            "csv"
        } else {
            "xlsx"
        }
    );

    if request.format.eq_ignore_ascii_case("csv") {
        let mut writer = WriterBuilder::new().from_writer(vec![]);
        writer
            .write_record(&headers)
            .map_err(|error| error.to_string())?;

        for question in &request.bank.questions {
            let row = export_row(question, max_options);
            let values = headers
                .iter()
                .map(|key| {
                    row.get(key)
                        .and_then(|value| value.as_str())
                        .unwrap_or("")
                        .to_string()
                })
                .collect::<Vec<_>>();
            writer
                .write_record(values)
                .map_err(|error| error.to_string())?;
        }

        let mut bytes = writer.into_inner().map_err(|error| error.to_string())?;
        let mut with_bom = vec![0xEF, 0xBB, 0xBF];
        with_bom.append(&mut bytes);
        return Ok(ExportResponse {
            bytes: with_bom,
            file_name,
        });
    }

    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    for (col, header) in headers.iter().enumerate() {
        worksheet
            .write_string(0, col as u16, header)
            .map_err(|error: XlsxError| error.to_string())?;
    }

    for (row_index, question) in request.bank.questions.iter().enumerate() {
        let row = export_row(question, max_options);
        for (col, header) in headers.iter().enumerate() {
            let value = row
                .get(header)
                .and_then(|value| value.as_str())
                .unwrap_or("");
            worksheet
                .write_string((row_index + 1) as u32, col as u16, value)
                .map_err(|error: XlsxError| error.to_string())?;
        }
    }

    let bytes = workbook
        .save_to_buffer()
        .map_err(|error| error.to_string())?;
    Ok(ExportResponse { bytes, file_name })
}
