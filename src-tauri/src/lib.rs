use tauri::Manager;
use std::process::Command;
use std::path::PathBuf;

#[tauri::command]
fn get_ml_suggestions(app_handle: tauri::AppHandle) -> Result<String, String> {
    let app_data_dir = app_handle.path().app_data_dir()
        .map_err(|e| e.to_string())?;
    
    // Create directory if it doesn't exist
    std::fs::create_dir_all(&app_data_dir).map_err(|e| e.to_string())?;
    let db_path = app_data_dir.join("accomplishments.db");
    
    // Resolve resource paths
    let resource_dir = app_handle.path().resource_dir()
        .map_err(|e| e.to_string())?;
    
    let script_path = resource_dir.join("src").join("thinker_sidecar.py");
    let seed_csv_path = resource_dir.join("src").join("seed_data.csv");
    
    let output = if script_path.exists() {
        // Executed inside the packaged app resources
        Command::new("python3")
            .arg(&script_path)
            .arg("--db-path")
            .arg(&db_path)
            .arg("--seed-csv")
            .arg(&seed_csv_path)
            .output()
            .map_err(|e| format!("Failed to run sidecar script: {}", e))?
    } else {
        // Fallback for local development environment
        let local_script = PathBuf::from("src-tauri/src/thinker_sidecar.py");
        let local_csv = PathBuf::from("src-tauri/src/seed_data.csv");
        if local_script.exists() {
            Command::new("python3")
                .arg(&local_script)
                .arg("--db-path")
                .arg(&db_path)
                .arg("--seed-csv")
                .arg(&local_csv)
                .output()
                .map_err(|e| format!("Failed to run local dev script: {}", e))?
        } else {
            return Err("ML sidecar script not found in resources or workspace.".to_string());
        }
    };
    
    if output.status.success() {
        let stdout = String::from_utf8(output.stdout)
            .map_err(|e| format!("Invalid UTF-8 output: {}", e))?;
        Ok(stdout)
    } else {
        let stderr = String::from_utf8(output.stderr)
            .unwrap_or_else(|_| "Unknown error".to_string());
        Err(format!("Sidecar failed: {}", stderr))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(
                    "sqlite:accomplishments.db",
                    vec![tauri_plugin_sql::Migration {
                        version: 1,
                        description: "create_initial_tables",
                        sql: "
                            CREATE TABLE IF NOT EXISTS payroll_accomplishments (
                                id TEXT PRIMARY KEY,
                                active_key TEXT,
                                text TEXT,
                                category TEXT,
                                date TEXT,
                                created_at INTEGER
                            );
                            CREATE TABLE IF NOT EXISTS wfh_logs (
                                id TEXT PRIMARY KEY,
                                active_key TEXT,
                                output TEXT,
                                hours TEXT,
                                target_code TEXT,
                                date TEXT,
                                created_at INTEGER
                            );
                            CREATE TABLE IF NOT EXISTS ipcr_targets (
                                id TEXT PRIMARY KEY,
                                name TEXT,
                                required_hours INTEGER,
                                color TEXT
                            );
                            INSERT OR IGNORE INTO ipcr_targets (id, name, required_hours, color) VALUES
                                ('IPCR-B-004', 'System Development & Vue 3', 40, 'bg-emerald-400'),
                                ('IPCR-A-102', 'Data Processing & R Scripting', 32, 'bg-blue-400'),
                                ('IPCR-A-101', 'Technical Documentation', 16, 'bg-amber-400'),
                                ('IPCR-ADMIN', 'Administrative & Support', 16, 'bg-purple-400');
                        ",
                        kind: tauri_plugin_sql::MigrationKind::Up,
                    }],
                )
                .build(),
        )
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_ml_suggestions])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
