use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::{
    path::Path,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{Emitter, State, Window};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiProviderConfig {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub config_type: String,
    pub provider: Option<String>,
    pub base_url: String,
    pub api_key: String,
    pub model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiCompleteRequest {
    pub provider_config_id: String,
    pub messages: Vec<AiMessage>,
    pub stream: bool,
    pub request_id: Option<String>,
    pub temperature: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiCompleteResponse {
    pub content: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct AiStreamChunkEvent {
    request_id: String,
    content: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct AiStreamDoneEvent {
    request_id: String,
    content: String,
}

fn now_millis() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64
}

fn open_connection(db_path: &Path) -> Result<Connection, String> {
    Connection::open(db_path).map_err(|error| error.to_string())
}

pub fn initialize_database(db_path: &Path) -> Result<(), String> {
    let conn = open_connection(db_path)?;
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS ai_configs (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            config_type TEXT NOT NULL,
            provider TEXT,
            base_url TEXT NOT NULL,
            api_key TEXT NOT NULL,
            model TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );
        "#,
    )
    .map_err(|error| error.to_string())?;

    Ok(())
}

fn read_config(conn: &Connection, id: &str) -> Result<Option<AiProviderConfig>, String> {
    conn.query_row(
        r#"
        SELECT id, name, config_type, provider, base_url, api_key, model
        FROM ai_configs
        WHERE id = ?1
        "#,
        [id],
        |row| {
            Ok(AiProviderConfig {
                id: row.get(0)?,
                name: row.get(1)?,
                config_type: row.get(2)?,
                provider: row.get(3)?,
                base_url: row.get(4)?,
                api_key: row.get(5)?,
                model: row.get(6)?,
            })
        },
    )
    .optional()
    .map_err(|error| error.to_string())
}

fn save_config(conn: &Connection, config: &AiProviderConfig) -> Result<(), String> {
    let timestamp = now_millis();
    let existing = read_config(conn, &config.id)?;

    if existing.is_some() {
        conn.execute(
            r#"
            UPDATE ai_configs
            SET name = ?2,
                config_type = ?3,
                provider = ?4,
                base_url = ?5,
                api_key = ?6,
                model = ?7,
                updated_at = ?8
            WHERE id = ?1
            "#,
            params![
                config.id,
                config.name,
                config.config_type,
                config.provider,
                config.base_url,
                config.api_key,
                config.model,
                timestamp
            ],
        )
        .map_err(|error| error.to_string())?;
    } else {
        conn.execute(
            r#"
            INSERT INTO ai_configs (
                id, name, config_type, provider, base_url, api_key, model, created_at, updated_at
            )
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
            "#,
            params![
                config.id,
                config.name,
                config.config_type,
                config.provider,
                config.base_url,
                config.api_key,
                config.model,
                timestamp,
                timestamp
            ],
        )
        .map_err(|error| error.to_string())?;
    }

    Ok(())
}

fn delete_config(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM ai_configs WHERE id = ?1", [id])
        .map_err(|error| error.to_string())?;
    Ok(())
}

fn normalize_base_url(base_url: &str) -> String {
    if base_url.ends_with("/chat/completions") {
        base_url.to_string()
    } else {
        format!("{}/chat/completions", base_url.trim_end_matches('/'))
    }
}

async fn fetch_response_text(response: reqwest::Response) -> Result<String, String> {
    response.text().await.map_err(|error| error.to_string())
}

async fn request_ai_completion(
    config: AiProviderConfig,
    request: AiCompleteRequest,
    window: Option<Window>,
) -> Result<AiCompleteResponse, String> {
    if config.base_url.trim().is_empty() {
        return Err("AI base URL is required".to_string());
    }
    if config.api_key.trim().is_empty() {
        return Err("AI API key is required".to_string());
    }
    if config.model.trim().is_empty() {
        return Err("AI model is required".to_string());
    }

    let client = reqwest::Client::new();
    let response = client
        .post(normalize_base_url(&config.base_url))
        .bearer_auth(config.api_key)
        .json(&serde_json::json!({
            "model": config.model,
            "messages": request.messages,
            "temperature": request.temperature.unwrap_or(0.7),
            "stream": request.stream,
        }))
        .send()
        .await
        .map_err(|error| error.to_string())?;

    if !response.status().is_success() {
        let payload = fetch_response_text(response).await?;
        if let Ok(value) = serde_json::from_str::<serde_json::Value>(&payload) {
            if let Some(message) = value
                .pointer("/error/message")
                .and_then(|value| value.as_str())
            {
                return Err(message.to_string());
            }
        }
        return Err(payload);
    }

    if request.stream {
        let request_id = request
            .request_id
            .unwrap_or_else(|| format!("ai-{}", now_millis()));
        let mut buffer = String::new();
        let mut full_text = String::new();

        let mut response = response;
        while let Some(chunk) = response.chunk().await.map_err(|error| error.to_string())? {
            buffer.push_str(&String::from_utf8_lossy(&chunk));

            while let Some(split_index) = buffer.find('\n') {
                let line = buffer[..split_index].trim().to_string();
                buffer.drain(..split_index + 1);

                if !line.starts_with("data:") {
                    continue;
                }

                let data = line.trim_start_matches("data:").trim();
                if data == "[DONE]" {
                    if let Some(window) = &window {
                        let _ = window.emit(
                            "ai-stream:done",
                            AiStreamDoneEvent {
                                request_id: request_id.clone(),
                                content: full_text.clone(),
                            },
                        );
                    }
                    return Ok(AiCompleteResponse { content: full_text });
                }

                if let Ok(value) = serde_json::from_str::<serde_json::Value>(data) {
                    if let Some(content) = value
                        .pointer("/choices/0/delta/content")
                        .and_then(|value| value.as_str())
                    {
                        if !content.is_empty() {
                            full_text.push_str(content);
                            if let Some(window) = &window {
                                let _ = window.emit(
                                    "ai-stream:chunk",
                                    AiStreamChunkEvent {
                                        request_id: request_id.clone(),
                                        content: content.to_string(),
                                    },
                                );
                            }
                        }
                    }
                }
            }
        }

        if let Some(window) = &window {
            let _ = window.emit(
                "ai-stream:done",
                AiStreamDoneEvent {
                    request_id,
                    content: full_text.clone(),
                },
            );
        }

        return Ok(AiCompleteResponse { content: full_text });
    }

    let payload = response
        .json::<serde_json::Value>()
        .await
        .map_err(|error| error.to_string())?;

    let content = payload
        .pointer("/choices/0/message/content")
        .and_then(|value| value.as_str())
        .ok_or_else(|| "AI response did not include message content".to_string())?;

    Ok(AiCompleteResponse {
        content: content.to_string(),
    })
}

#[tauri::command]
pub async fn save_ai_config(
    state: State<'_, crate::AppState>,
    config: AiProviderConfig,
) -> Result<(), String> {
    let conn = open_connection(&state.db_path)?;
    save_config(&conn, &config)
}

#[tauri::command]
pub async fn delete_ai_config(state: State<'_, crate::AppState>, id: String) -> Result<(), String> {
    let conn = open_connection(&state.db_path)?;
    delete_config(&conn, &id)
}

#[tauri::command]
pub async fn get_ai_config(
    state: State<'_, crate::AppState>,
    id: String,
) -> Result<Option<AiProviderConfig>, String> {
    let conn = open_connection(&state.db_path)?;
    read_config(&conn, &id)
}

#[tauri::command]
pub async fn list_ai_configs(
    state: State<'_, crate::AppState>,
) -> Result<Vec<AiProviderConfig>, String> {
    let conn = open_connection(&state.db_path)?;
    let mut stmt = conn
        .prepare(
            r#"
            SELECT id, name, config_type, provider, base_url, api_key, model
            FROM ai_configs
            ORDER BY updated_at DESC
            "#,
        )
        .map_err(|error| error.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(AiProviderConfig {
                id: row.get(0)?,
                name: row.get(1)?,
                config_type: row.get(2)?,
                provider: row.get(3)?,
                base_url: row.get(4)?,
                api_key: row.get(5)?,
                model: row.get(6)?,
            })
        })
        .map_err(|error| error.to_string())?;

    let mut configs = Vec::new();
    for row in rows {
        configs.push(row.map_err(|error| error.to_string())?);
    }
    Ok(configs)
}

#[tauri::command]
pub async fn ai_complete(
    state: State<'_, crate::AppState>,
    window: Window,
    request: AiCompleteRequest,
) -> Result<AiCompleteResponse, String> {
    let conn = open_connection(&state.db_path)?;
    let config = read_config(&conn, &request.provider_config_id)?
        .ok_or_else(|| "AI configuration not found".to_string())?;
    request_ai_completion(config, request, Some(window)).await
}
