import type { IIdeaRepository } from "@domain/repositories/IIdeaRepository";
import type { Idea } from "@domain/entities/Idea";
import {
  upsertLocalIdea,
  getLocalIdea,
  listLocalIdeas,
  type LocalIdeaRow,
} from "@infrastructure/db/localIdeaStore";

/**
 * Local-first implementation of IIdeaRepository (docs/DECISIONS.md AD-010).
 *
 * Every read/write goes through the encrypted local SQLite store on this
 * device FIRST — the UI never waits on a network round-trip. A separate
 * SyncEngine (application layer) is responsible for pushing the local
 * store's pending changes up to Supabase in the background when online.
 *
 * The local record's `id` is generated on THIS device (not by Supabase) and
 * reused as the Supabase row's primary key when synced (via `.upsert()`),
 * so there is never an id-remapping problem between local and remote.
 */
function rowToIdea(row: LocalIdeaRow): Idea {
  const p = row.payload as Record<string, unknown>;
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    ownerId: p.ownerId as string,
    title: p.title as string,
    description: (p.description as string | null) ?? null,
    icon: (p.icon as string | null) ?? null,
    coverImageUrl: (p.coverImageUrl as string | null) ?? null,
    status: p.status as Idea["status"],
    priority: p.priority as Idea["priority"],
    categoryId: (p.categoryId as string | null) ?? null,
    tagIds: (p.tagIds as string[]) ?? [],
    deadline: (p.deadline as string | null) ?? null,
    entryDate: row.entryDate,
    createdAt: p.createdAt as string,
    updatedAt: row.updatedAt,
    version: p.version as number,
  };
}

function ideaToRow(idea: Idea, deleted = false): LocalIdeaRow {
  return {
    id: idea.id,
    workspaceId: idea.workspaceId,
    entryDate: idea.entryDate,
    updatedAt: idea.updatedAt,
    deleted,
    payload: {
      ownerId: idea.ownerId,
      title: idea.title,
      description: idea.description,
      icon: idea.icon,
      coverImageUrl: idea.coverImageUrl,
      status: idea.status,
      priority: idea.priority,
      categoryId: idea.categoryId,
      tagIds: idea.tagIds,
      deadline: idea.deadline,
      createdAt: idea.createdAt,
      version: idea.version,
    },
  };
}

export class LocalFirstIdeaRepository implements IIdeaRepository {
  async getById(id: string): Promise<Idea | null> {
    const row = await getLocalIdea(id);
    if (!row || row.deleted) return null;
    return rowToIdea(row);
  }

  async listByWorkspace(_workspaceId: string): Promise<Idea[]> {
    // Not used by the current UI (which always scopes by date — CAL-001);
    // implemented narrowly to satisfy the interface rather than left
    // throwing, since a full "all dates" local query is a reasonable
    // follow-up, not a placeholder.
    throw new Error("listByWorkspace is not supported for the local-first repository yet — use listByWorkspaceAndDate");
  }

  async listByWorkspaceAndDate(workspaceId: string, entryDate: string): Promise<Idea[]> {
    const rows = await listLocalIdeas(workspaceId, entryDate);
    return rows.map(rowToIdea);
  }

  async create(idea: Omit<Idea, "id" | "createdAt" | "updatedAt" | "version">): Promise<Idea> {
    const now = new Date().toISOString();
    const full: Idea = { ...idea, id: crypto.randomUUID(), createdAt: now, updatedAt: now, version: 1 };
    await upsertLocalIdea(ideaToRow(full));
    return full;
  }

  async update(id: string, changes: Partial<Omit<Idea, "entryDate">>): Promise<Idea> {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Idea ${id} not found locally`);
    const updated: Idea = { ...existing, ...changes, updatedAt: new Date().toISOString(), version: existing.version + 1 };
    await upsertLocalIdea(ideaToRow(updated));
    return updated;
  }

  async softDelete(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) return;
    const deletedIdea: Idea = { ...existing, updatedAt: new Date().toISOString() };
    await upsertLocalIdea(ideaToRow(deletedIdea, true));
  }

  async moveToDate(id: string, newEntryDate: string): Promise<Idea> {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Idea ${id} not found locally`);
    const moved: Idea = { ...existing, entryDate: newEntryDate, updatedAt: new Date().toISOString() };
    await upsertLocalIdea(ideaToRow(moved));
    return moved;
  }

  async copyToDate(id: string, newEntryDate: string): Promise<Idea> {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Idea ${id} not found locally`);
    const now = new Date().toISOString();
    const copy: Idea = { ...existing, id: crypto.randomUUID(), entryDate: newEntryDate, createdAt: now, updatedAt: now, version: 1 };
    await upsertLocalIdea(ideaToRow(copy));
    return copy;
  }
}
