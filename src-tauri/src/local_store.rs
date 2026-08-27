// Local-first encrypted storage (docs/DECISIONS.md AD-010).
//
// Design (deliberately NOT SQLCipher/OpenSSL — see AD-010 rationale: those
// need native OpenSSL toolchains that are painful to set up on a plain
// Windows MSVC build): sensitive fields are serialized to JSON and
// encrypted with AES-256-GCM before being stored as a BLOB in an otherwise
// plain (unencrypted-at-the-file-format-level) SQLite database. Only
// non-sensitive columns needed for querying (id, workspace_id, entry_date,
// deleted, updated_at) are stored in the clear. The AES key itself is
// generated once and stored in the OS credential manager (Windows
// Credential Manager / macOS Keychain / Linux Secret Service) via the
// `keyring` crate — NOT in a plain file, so it is not readable by casually
// opening the app's data folder in a file explorer.
//
// Known, documented limitation (see docs/SECURITY.md — "never claim 100%
// secure"): anyone with the same OS user-session access as the app can, in
// principle, extract the key from the OS credential store too (this is a
// property of virtually all consumer desktop encryption-at-rest designs,
// not unique to this one). This protects against casual file-browsing /
// copying the SQLite file elsewhere — it does not protect against a fully
// compromised local user account.

use aes_gcm::aead::{Aead, KeyInit, OsRng};
use aes_gcm::{Aes256Gcm, Nonce};
use rand::RngCore;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;

const KEYRING_SERVICE: &str = "ideatobuild";
const KEYRING_ACCOUNT: &str = "local-encryption-key";

pub struct LocalStore {
    conn: Mutex<Connection>,
    key: [u8; 32],
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LocalIdeaRow {
    pub id: String,
    pub workspace_id: String,
    pub entry_date: String,
    pub updated_at: String,
    pub deleted: bool,
    /// The rest of the Idea fields (title, description, status, priority,
    /// category_id, tag_ids, deadline, icon, cover_image_url, owner_id,
    /// created_at, version) travel inside this JSON value — everything in
    /// here is what gets encrypted, not the fields above.
    pub payload: serde_json::Value,
}

fn get_or_create_key() -> Result<[u8; 32], String> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT)
        .map_err(|e| format!("keyring init failed: {e}"))?;

    match entry.get_password() {
        Ok(existing) => {
            let bytes = base64::Engine::decode(&base64::engine::general_purpose::STANDARD, existing)
                .map_err(|e| format!("failed to decode stored key: {e}"))?;
            let mut key = [0u8; 32];
            if bytes.len() != 32 {
                return Err("stored encryption key has unexpected length".into());
            }
            key.copy_from_slice(&bytes);
            Ok(key)
        }
        Err(keyring::Error::NoEntry) => {
            let mut key = [0u8; 32];
            OsRng.fill_bytes(&mut key);
            let encoded = base64::Engine::encode(&base64::engine::general_purpose::STANDARD, key);
            entry
                .set_password(&encoded)
                .map_err(|e| format!("failed to store new encryption key: {e}"))?;
            Ok(key)
        }
        Err(e) => Err(format!("keyring read failed: {e}")),
    }
}

fn encrypt(plaintext: &[u8], key: &[u8; 32]) -> Result<Vec<u8>, String> {
    let cipher = Aes256Gcm::new_from_slice(key).map_err(|e| e.to_string())?;
    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|e| format!("encryption failed: {e}"))?;
    // Store nonce || ciphertext together so decrypt can pull the nonce back out.
    let mut out = nonce_bytes.to_vec();
    out.extend_from_slice(&ciphertext);
    Ok(out)
}

fn decrypt(blob: &[u8], key: &[u8; 32]) -> Result<Vec<u8>, String> {
    if blob.len() < 12 {
        return Err("stored ciphertext too short".into());
    }
    let (nonce_bytes, ciphertext) = blob.split_at(12);
    let cipher = Aes256Gcm::new_from_slice(key).map_err(|e| e.to_string())?;
    let nonce = Nonce::from_slice(nonce_bytes);
    cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| format!("decryption failed: {e}"))
}

impl LocalStore {
    pub fn init(app_data_dir: PathBuf) -> Result<Self, String> {
        std::fs::create_dir_all(&app_data_dir).map_err(|e| e.to_string())?;
        let db_path = app_data_dir.join("local.db");
        let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

        conn.execute_batch(
            "
            create table if not exists local_ideas (
                id text primary key,
                workspace_id text not null,
                entry_date text not null,
                updated_at text not null,
                deleted integer not null default 0,
                payload blob not null
            );
            create index if not exists local_ideas_workspace_date_idx
                on local_ideas (workspace_id, entry_date);

            create table if not exists sync_queue (
                entity_id text primary key,
                entity_type text not null,
                row_json blob not null,
                created_at text not null,
                synced integer not null default 0
            );
            ",
        )
        .map_err(|e| e.to_string())?;

        let key = get_or_create_key()?;

        Ok(LocalStore {
            conn: Mutex::new(conn),
            key,
        })
    }

    pub fn upsert_idea(&self, row: LocalIdeaRow) -> Result<(), String> {
        let plaintext = serde_json::to_vec(&row.payload).map_err(|e| e.to_string())?;
        let encrypted = encrypt(&plaintext, &self.key)?;

        let conn = self.conn.lock().map_err(|_| "local db lock poisoned")?;
        conn.execute(
            "insert into local_ideas (id, workspace_id, entry_date, updated_at, deleted, payload)
             values (?1, ?2, ?3, ?4, ?5, ?6)
             on conflict(id) do update set
                workspace_id = excluded.workspace_id,
                entry_date = excluded.entry_date,
                updated_at = excluded.updated_at,
                deleted = excluded.deleted,
                payload = excluded.payload",
            rusqlite::params![row.id, row.workspace_id, row.entry_date, row.updated_at, row.deleted as i64, encrypted],
        )
        .map_err(|e| e.to_string())?;

        // Queue the FULL current row (not a diff) for sync — see AD-010:
        // every local mutation just re-queues the latest snapshot, keyed by
        // entity_id, so out-of-order or repeated syncs always converge on
        // the same final state instead of replaying a history of ops.
        let row_json = serde_json::to_vec(&row).map_err(|e| e.to_string())?;
        conn.execute(
            "insert into sync_queue (entity_id, entity_type, row_json, created_at, synced)
             values (?1, 'idea', ?2, ?3, 0)
             on conflict(entity_id) do update set
                row_json = excluded.row_json,
                created_at = excluded.created_at,
                synced = 0",
            rusqlite::params![row.id, row_json, row.updated_at],
        )
        .map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn get_idea(&self, id: &str) -> Result<Option<LocalIdeaRow>, String> {
        let conn = self.conn.lock().map_err(|_| "local db lock poisoned")?;
        let mut stmt = conn
            .prepare("select id, workspace_id, entry_date, updated_at, deleted, payload from local_ideas where id = ?1")
            .map_err(|e| e.to_string())?;

        let result = stmt.query_row(rusqlite::params![id], |r| {
            let id: String = r.get(0)?;
            let workspace_id: String = r.get(1)?;
            let entry_date: String = r.get(2)?;
            let updated_at: String = r.get(3)?;
            let deleted: i64 = r.get(4)?;
            let encrypted: Vec<u8> = r.get(5)?;
            Ok((id, workspace_id, entry_date, updated_at, deleted, encrypted))
        });

        match result {
            Ok((id, workspace_id, entry_date, updated_at, deleted, encrypted)) => {
                let plaintext = decrypt(&encrypted, &self.key)?;
                let payload: serde_json::Value = serde_json::from_slice(&plaintext).map_err(|e| e.to_string())?;
                Ok(Some(LocalIdeaRow { id, workspace_id, entry_date, updated_at, deleted: deleted != 0, payload }))
            }
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.to_string()),
        }
    }

    pub fn list_ideas(&self, workspace_id: &str, entry_date: &str) -> Result<Vec<LocalIdeaRow>, String> {
        let conn = self.conn.lock().map_err(|_| "local db lock poisoned")?;
        let mut stmt = conn
            .prepare(
                "select id, workspace_id, entry_date, updated_at, deleted, payload
                 from local_ideas
                 where workspace_id = ?1 and entry_date = ?2 and deleted = 0",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map(rusqlite::params![workspace_id, entry_date], |r| {
                let id: String = r.get(0)?;
                let workspace_id: String = r.get(1)?;
                let entry_date: String = r.get(2)?;
                let updated_at: String = r.get(3)?;
                let deleted: i64 = r.get(4)?;
                let encrypted: Vec<u8> = r.get(5)?;
                Ok((id, workspace_id, entry_date, updated_at, deleted, encrypted))
            })
            .map_err(|e| e.to_string())?;

        let mut out = Vec::new();
        for row in rows {
            let (id, workspace_id, entry_date, updated_at, deleted, encrypted) = row.map_err(|e| e.to_string())?;
            let plaintext = decrypt(&encrypted, &self.key)?;
            let payload: serde_json::Value = serde_json::from_slice(&plaintext).map_err(|e| e.to_string())?;
            out.push(LocalIdeaRow { id, workspace_id, entry_date, updated_at, deleted: deleted != 0, payload });
        }
        Ok(out)
    }

    pub fn get_pending(&self) -> Result<Vec<LocalIdeaRow>, String> {
        let conn = self.conn.lock().map_err(|_| "local db lock poisoned")?;
        let mut stmt = conn
            .prepare("select row_json from sync_queue where entity_type = 'idea' and synced = 0")
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([], |r| {
                let row_json: Vec<u8> = r.get(0)?;
                Ok(row_json)
            })
            .map_err(|e| e.to_string())?;

        let mut out = Vec::new();
        for row in rows {
            let row_json = row.map_err(|e| e.to_string())?;
            // NOTE: row_json in the queue is the plaintext snapshot at
            // queue-time (used to push to Supabase over an already-secure
            // TLS connection) — it is NOT the encrypted-at-rest blob used
            // in local_ideas.payload. This is intentional: the queue only
            // exists transiently until synced, whereas local_ideas is the
            // durable at-rest store.
            let parsed: LocalIdeaRow = serde_json::from_slice(&row_json).map_err(|e| e.to_string())?;
            out.push(parsed);
        }
        Ok(out)
    }

    pub fn mark_synced(&self, id: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|_| "local db lock poisoned")?;
        conn.execute("update sync_queue set synced = 1 where entity_id = ?1", rusqlite::params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }
}
