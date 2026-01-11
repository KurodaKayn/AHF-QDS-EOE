use std::path::PathBuf;
use tauri::{AppHandle, Manager, State};
use serde::{Deserialize, Serialize};
use log::info;

#[derive(Debug, Serialize, Deserialize)]
struct AppState {
    log_path: PathBuf,
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .setup(|app| {
            // Get app data directory for logs
            let app_data_dir = app.path().app_data_dir()
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
            handle_message
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
