// Each #[tauri::command] below is a security boundary (docs/SECURITY.md,
// Section 27). Keep every command narrow and documented. Do not expose
// arbitrary shell/file access.

mod local_store;

use local_store::{LocalIdeaRow, LocalStore};
use tauri::Manager;

#[tauri::command]
fn app_version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}

// ─────────────────────────────────────────────────────────────────────────
// Local-first encrypted storage commands (docs/DECISIONS.md AD-010).
// Each one is a narrow, single-purpose boundary — no generic "run any SQL"
// command is exposed to the frontend (per docs/SECURITY.md, Tauri commands
// must have a narrow purpose, least privilege).
// ─────────────────────────────────────────────────────────────────────────

#[tauri::command]
fn local_idea_upsert(state: tauri::State<LocalStore>, row: LocalIdeaRow) -> Result<(), String> {
    state.upsert_idea(row)
}

#[tauri::command]
fn local_idea_get(state: tauri::State<LocalStore>, id: String) -> Result<Option<LocalIdeaRow>, String> {
    state.get_idea(&id)
}

#[tauri::command]
fn local_idea_list(state: tauri::State<LocalStore>, workspace_id: String, entry_date: String) -> Result<Vec<LocalIdeaRow>, String> {
    state.list_ideas(&workspace_id, &entry_date)
}

#[tauri::command]
fn local_idea_pending(state: tauri::State<LocalStore>) -> Result<Vec<LocalIdeaRow>, String> {
    state.get_pending()
}

#[tauri::command]
fn local_idea_mark_synced(state: tauri::State<LocalStore>, id: String) -> Result<(), String> {
    state.mark_synced(&id)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("failed to resolve app data dir");
            let store = LocalStore::init(app_data_dir).expect("failed to initialize local encrypted store");
            app.manage(store);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            app_version,
            local_idea_upsert,
            local_idea_get,
            local_idea_list,
            local_idea_pending,
            local_idea_mark_synced
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
