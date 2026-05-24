use log::info;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use axum::{
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use tauri::{AppHandle, Manager, State};

#[derive(Debug, Serialize, Deserialize)]
struct AppState {
    log_path: PathBuf,
}

#[derive(Debug, Serialize)]
struct HealthResponse {
    status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AiMessage {
    role: String,
    content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AiCompleteRequest {
    base_url: String,
    api_key: String,
    model: String,
    messages: Vec<AiMessage>,
    temperature: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AiCompleteResponse {
    content: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ApiError {
    message: String,
}

fn build_axum_router() -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/ai/complete", post(ai_complete_route))
}

async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
    })
}

async fn ai_complete_route(Json(request): Json<AiCompleteRequest>) -> impl IntoResponse {
    match complete_ai(request).await {
        Ok(response) => (StatusCode::OK, Json(response)).into_response(),
        Err(message) => (StatusCode::BAD_GATEWAY, Json(ApiError { message })).into_response(),
    }
}

fn chat_completions_url(base_url: &str) -> String {
    if base_url.ends_with("/chat/completions") {
        base_url.to_string()
    } else {
        format!("{}/chat/completions", base_url.trim_end_matches('/'))
    }
}

async fn complete_ai(request: AiCompleteRequest) -> Result<AiCompleteResponse, String> {
    if request.base_url.trim().is_empty() {
        return Err("AI base URL is required".to_string());
    }

    if request.api_key.trim().is_empty() {
        return Err("AI API key is required".to_string());
    }

    if request.model.trim().is_empty() {
        return Err("AI model is required".to_string());
    }

    let client = reqwest::Client::new();
    let response = client
        .post(chat_completions_url(&request.base_url))
        .bearer_auth(request.api_key)
        .json(&serde_json::json!({
            "model": request.model,
            "messages": request.messages,
            "temperature": request.temperature.unwrap_or(0.7),
        }))
        .send()
        .await
        .map_err(|error| error.to_string())?;

    let status = response.status();
    let payload = response
        .json::<serde_json::Value>()
        .await
        .map_err(|error| error.to_string())?;

    if !status.is_success() {
        let message = payload
            .pointer("/error/message")
            .and_then(|value| value.as_str())
            .unwrap_or_else(|| status.canonical_reason().unwrap_or("AI request failed"));
        return Err(format!("{} ({})", message, status.as_u16()));
    }

    let content = payload
        .pointer("/choices/0/message/content")
        .and_then(|value| value.as_str())
        .ok_or_else(|| "AI response did not include message content".to_string())?;

    Ok(AiCompleteResponse {
        content: content.to_string(),
    })
}

// Tauri command to get log path
#[tauri::command]
async fn get_log_path(state: State<'_, AppState>) -> Result<String, String> {
    Ok(state.log_path.to_string_lossy().to_string())
}

// Tauri command to restart app
#[tauri::command]
async fn restart_app(app_handle: AppHandle) -> Result<(), String> {
    info!("Restart app requested");
    app_handle.restart();
}

// Tauri command for IPC communication
#[tauri::command]
async fn handle_message(message: String) -> Result<String, String> {
    info!("Received message from frontend: {}", message);
    Ok("Message received by main process".to_string())
}

#[tauri::command]
async fn ai_complete(request: AiCompleteRequest) -> Result<AiCompleteResponse, String> {
    complete_ai(request).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _axum_router = build_axum_router();

    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .setup(|app| {
            // Get app data directory for logs
            let app_data_dir = app
                .path()
                .app_data_dir()
                .map_err(|e| format!("Failed to get app data directory: {}", e))?;

            // Create logs directory
            let log_dir = app_data_dir.join("logs");
            std::fs::create_dir_all(&log_dir)
                .map_err(|e| format!("Failed to create logs directory: {}", e))?;

            let log_path = log_dir.join("app.log");

            // Initialize app state
            app.manage(AppState {
                log_path: log_path.clone(),
            });

            info!("Application started successfully");
            info!("Log path: {}", log_path.display());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_log_path,
            restart_app,
            handle_message,
            ai_complete
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
