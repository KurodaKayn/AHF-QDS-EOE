use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::Path;
use tauri::State;

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
pub struct QuestionRecord {
    pub id: Option<String>,
    pub question_id: String,
    pub user_answer: serde_json::Value,
    pub is_correct: bool,
    pub answered_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuizSnapshot {
    pub question_banks: Vec<QuestionBank>,
    pub records: Vec<QuestionRecord>,
}

fn open_connection(db_path: &Path) -> Result<Connection, String> {
    Connection::open(db_path).map_err(|error| error.to_string())
}

pub fn initialize_database(db_path: &Path) -> Result<(), String> {
    let conn = open_connection(db_path)?;
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS question_banks (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS questions (
            id TEXT PRIMARY KEY,
            bank_id TEXT NOT NULL,
            question_type TEXT NOT NULL,
            content TEXT NOT NULL,
            answer_json TEXT NOT NULL,
            explanation TEXT,
            tags_json TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (bank_id) REFERENCES question_banks(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_questions_bank_id ON questions(bank_id);
        CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);
        CREATE INDEX IF NOT EXISTS idx_questions_content ON questions(content);

        CREATE TABLE IF NOT EXISTS question_options (
            id TEXT NOT NULL,
            question_id TEXT NOT NULL,
            content TEXT NOT NULL,
            sort_order INTEGER NOT NULL,
            PRIMARY KEY (question_id, id),
            FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_question_options_question_id
            ON question_options(question_id);

        CREATE TABLE IF NOT EXISTS question_records (
            id TEXT PRIMARY KEY,
            question_id TEXT NOT NULL,
            user_answer_json TEXT NOT NULL,
            is_correct INTEGER NOT NULL,
            answered_at INTEGER NOT NULL,
            FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_question_records_question_id
            ON question_records(question_id);
        CREATE INDEX IF NOT EXISTS idx_question_records_is_correct
            ON question_records(is_correct);
        "#,
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}

fn save_snapshot(conn: &mut Connection, snapshot: &QuizSnapshot) -> Result<(), String> {
    let tx = conn.transaction().map_err(|error| error.to_string())?;

    tx.execute("DELETE FROM question_records", [])
        .map_err(|error| error.to_string())?;
    tx.execute("DELETE FROM question_options", [])
        .map_err(|error| error.to_string())?;
    tx.execute("DELETE FROM questions", [])
        .map_err(|error| error.to_string())?;
    tx.execute("DELETE FROM question_banks", [])
        .map_err(|error| error.to_string())?;

    for bank in &snapshot.question_banks {
        tx.execute(
            r#"
            INSERT INTO question_banks (id, name, description, created_at, updated_at)
            VALUES (?1, ?2, ?3, ?4, ?5)
            "#,
            params![bank.id, bank.name, bank.description, bank.created_at, bank.updated_at],
        )
        .map_err(|error| error.to_string())?;

        for question in &bank.questions {
            let answer_json =
                serde_json::to_string(&question.answer).map_err(|error| error.to_string())?;
            let tags_json = question
                .tags
                .as_ref()
                .map(serde_json::to_string)
                .transpose()
                .map_err(|error| error.to_string())?;

            tx.execute(
                r#"
                INSERT INTO questions (
                    id, bank_id, question_type, content, answer_json, explanation,
                    tags_json, created_at, updated_at
                )
                VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
                "#,
                params![
                    question.id,
                    bank.id,
                    question.question_type,
                    question.content,
                    answer_json,
                    question.explanation,
                    tags_json,
                    question.created_at,
                    question.updated_at
                ],
            )
            .map_err(|error| error.to_string())?;

            for (index, option) in question.options.as_deref().unwrap_or(&[]).iter().enumerate() {
                tx.execute(
                    r#"
                    INSERT INTO question_options (id, question_id, content, sort_order)
                    VALUES (?1, ?2, ?3, ?4)
                    "#,
                    params![option.id, question.id, option.content, index as i64],
                )
                .map_err(|error| error.to_string())?;
            }
        }
    }

    for record in &snapshot.records {
        let user_answer_json =
            serde_json::to_string(&record.user_answer).map_err(|error| error.to_string())?;
        let id = record
            .id
            .clone()
            .unwrap_or_else(|| format!("record-{}-{}", record.question_id, record.answered_at));

        tx.execute(
            r#"
            INSERT INTO question_records (
                id, question_id, user_answer_json, is_correct, answered_at
            )
            VALUES (?1, ?2, ?3, ?4, ?5)
            "#,
            params![
                id,
                record.question_id,
                user_answer_json,
                record.is_correct as i64,
                record.answered_at
            ],
        )
        .map_err(|error| error.to_string())?;
    }

    tx.commit().map_err(|error| error.to_string())?;
    Ok(())
}

fn load_options(conn: &Connection, question_id: &str) -> Result<Vec<QuestionOption>, String> {
    let mut stmt = conn
        .prepare(
            r#"
            SELECT id, content
            FROM question_options
            WHERE question_id = ?1
            ORDER BY sort_order ASC
            "#,
        )
        .map_err(|error| error.to_string())?;

    let rows = stmt
        .query_map([question_id], |row| {
            Ok(QuestionOption {
                id: row.get(0)?,
                content: row.get(1)?,
            })
        })
        .map_err(|error| error.to_string())?;

    let mut options = Vec::new();
    for row in rows {
        options.push(row.map_err(|error| error.to_string())?);
    }
    Ok(options)
}

fn load_questions(conn: &Connection, bank_id: &str) -> Result<Vec<Question>, String> {
    let mut stmt = conn
        .prepare(
            r#"
            SELECT id, question_type, content, answer_json, explanation,
                   tags_json, created_at, updated_at
            FROM questions
            WHERE bank_id = ?1
            ORDER BY created_at ASC
            "#,
        )
        .map_err(|error| error.to_string())?;

    let rows = stmt
        .query_map([bank_id], |row| {
            let answer_json: String = row.get(3)?;
            let tags_json: Option<String> = row.get(5)?;
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                answer_json,
                row.get::<_, Option<String>>(4)?,
                tags_json,
                row.get::<_, i64>(6)?,
                row.get::<_, i64>(7)?,
            ))
        })
        .map_err(|error| error.to_string())?;

    let mut questions = Vec::new();
    for row in rows {
        let (id, question_type, content, answer_json, explanation, tags_json, created_at, updated_at) =
            row.map_err(|error| error.to_string())?;
        let answer = serde_json::from_str(&answer_json).map_err(|error| error.to_string())?;
        let tags = tags_json
            .map(|json| serde_json::from_str(&json))
            .transpose()
            .map_err(|error| error.to_string())?;
        let options = load_options(conn, &id)?;

        questions.push(Question {
            id,
            question_type,
            content,
            options: if options.is_empty() { None } else { Some(options) },
            answer,
            explanation,
            tags,
            created_at,
            updated_at,
        });
    }

    Ok(questions)
}

fn load_snapshot(conn: &Connection) -> Result<QuizSnapshot, String> {
    let mut bank_stmt = conn
        .prepare(
            r#"
            SELECT id, name, description, created_at, updated_at
            FROM question_banks
            ORDER BY created_at ASC
            "#,
        )
        .map_err(|error| error.to_string())?;

    let bank_rows = bank_stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, Option<String>>(2)?,
                row.get::<_, i64>(3)?,
                row.get::<_, i64>(4)?,
            ))
        })
        .map_err(|error| error.to_string())?;

    let mut question_banks = Vec::new();
    for row in bank_rows {
        let (id, name, description, created_at, updated_at) =
            row.map_err(|error| error.to_string())?;
        let questions = load_questions(conn, &id)?;
        question_banks.push(QuestionBank {
            id,
            name,
            description,
            questions,
            created_at,
            updated_at,
        });
    }

    let mut record_stmt = conn
        .prepare(
            r#"
            SELECT id, question_id, user_answer_json, is_correct, answered_at
            FROM question_records
            ORDER BY answered_at ASC
            "#,
        )
        .map_err(|error| error.to_string())?;

    let record_rows = record_stmt
        .query_map([], |row| {
            let user_answer_json: String = row.get(2)?;
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                user_answer_json,
                row.get::<_, i64>(3)?,
                row.get::<_, i64>(4)?,
            ))
        })
        .map_err(|error| error.to_string())?;

    let mut records = Vec::new();
    for row in record_rows {
        let (id, question_id, user_answer_json, is_correct, answered_at) =
            row.map_err(|error| error.to_string())?;
        records.push(QuestionRecord {
            id: Some(id),
            question_id,
            user_answer: serde_json::from_str(&user_answer_json)
                .map_err(|error| error.to_string())?,
            is_correct: is_correct != 0,
            answered_at,
        });
    }

    Ok(QuizSnapshot {
        question_banks,
        records,
    })
}

#[tauri::command]
pub async fn replace_quiz_snapshot(
    state: State<'_, crate::AppState>,
    snapshot: QuizSnapshot,
) -> Result<(), String> {
    let mut conn = open_connection(&state.db_path)?;
    save_snapshot(&mut conn, &snapshot)
}

#[tauri::command]
pub async fn load_quiz_snapshot(
    state: State<'_, crate::AppState>,
) -> Result<QuizSnapshot, String> {
    let conn = open_connection(&state.db_path)?;
    load_snapshot(&conn)
}
