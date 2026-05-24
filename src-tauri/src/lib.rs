mod ai;
mod quiz;

use axum::{
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use log::info;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{AppHandle, Manager, State};

#[derive(Debug, Serialize, Deserialize)]
struct AppState {
    pub(crate) log_path: PathBuf,
    pub(crate) db_path: PathBuf,
}

#[derive(Debug, Serialize)]
struct HealthResponse {
    status: String,
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

async fn ai_complete_route(Json(request): Json<ai::AiCompleteRequest>) -> impl IntoResponse {
    let _ = request;
    (
        StatusCode::NOT_IMPLEMENTED,
        Json(ApiError {
            message: "Use the Tauri command instead".to_string(),
        }),
    )
        .into_response()
}

#[tauri::command]
async fn get_log_path(state: State<'_, AppState>) -> Result<String, String> {
    Ok(state.log_path.to_string_lossy().to_string())
}

#[tauri::command]
async fn restart_app(app_handle: AppHandle) -> Result<(), String> {
    info!("Restart app requested");
    app_handle.restart();
}

#[tauri::command]
async fn handle_message(message: String) -> Result<String, String> {
    info!("Received message from frontend: {}", message);
    Ok("Message received by main process".to_string())
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
            let app_data_dir = app
                .path()
                .app_data_dir()
                .map_err(|e| format!("Failed to get app data directory: {}", e))?;

            let log_dir = app_data_dir.join("logs");
            std::fs::create_dir_all(&log_dir)
                .map_err(|e| format!("Failed to create logs directory: {}", e))?;

            let db_path = app_data_dir.join("quiz.db");
            ai::initialize_database(&db_path)?;
            quiz::initialize_database(&db_path)?;

            let log_path = log_dir.join("app.log");

            app.manage(AppState {
                log_path: log_path.clone(),
                db_path,
            });

            info!("Application started successfully");
            info!("Log path: {}", log_path.display());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_log_path,
            restart_app,
            handle_message,
            ai::save_ai_config,
            ai::delete_ai_config,
            ai::get_ai_config,
            ai::list_ai_configs,
            ai::ai_complete,
            quiz::replace_quiz_snapshot,
            quiz::load_quiz_snapshot
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
