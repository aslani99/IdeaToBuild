import { invoke } from "@tauri-apps/api/core";

/**
 * Thin wrapper over the Rust-side encrypted local store commands
 * (src-tauri/src/local_store.rs, AD-010). This is the ONLY place in the
 * frontend that calls these specific `invoke()` commands — everything else
 * goes through LocalFirstIdeaRepository (see docs/ARCHITECTURE.md).
 */
export interface LocalIdeaRow {
  id: string;
  workspaceId: string;
  entryDate: string;
  updatedAt: string;
  deleted: boolean;
  payload: Record<string, unknown>;
}

// Rust's serde uses snake_case field names by default for the struct.
interface RustLocalIdeaRow {
  id: string;
  workspace_id: string;
  entry_date: string;
  updated_at: string;
  deleted: boolean;
  payload: Record<string, unknown>;
}

function toRust(row: LocalIdeaRow): RustLocalIdeaRow {
  return {
    id: row.id,
    workspace_id: row.workspaceId,
    entry_date: row.entryDate,
    updated_at: row.updatedAt,
    deleted: row.deleted,
    payload: row.payload,
  };
}

function fromRust(row: RustLocalIdeaRow): LocalIdeaRow {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    entryDate: row.entry_date,
    updatedAt: row.updated_at,
    deleted: row.deleted,
    payload: row.payload,
  };
}

export async function upsertLocalIdea(row: LocalIdeaRow): Promise<void> {
  await invoke("local_idea_upsert", { row: toRust(row) });
}

export async function getLocalIdea(id: string): Promise<LocalIdeaRow | null> {
  const result = await invoke<RustLocalIdeaRow | null>("local_idea_get", { id });
  return result ? fromRust(result) : null;
}

export async function listLocalIdeas(workspaceId: string, entryDate: string): Promise<LocalIdeaRow[]> {
  const result = await invoke<RustLocalIdeaRow[]>("local_idea_list", { workspaceId, entryDate });
  return result.map(fromRust);
}

export async function getPendingLocalIdeas(): Promise<LocalIdeaRow[]> {
  const result = await invoke<RustLocalIdeaRow[]>("local_idea_pending");
  return result.map(fromRust);
}

export async function markLocalIdeaSynced(id: string): Promise<void> {
  await invoke("local_idea_mark_synced", { id });
}
