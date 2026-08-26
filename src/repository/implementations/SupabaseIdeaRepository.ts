import type { IIdeaRepository } from "@domain/repositories/IIdeaRepository";
import type { Idea, IdeaStatus, IdeaPriority } from "@domain/entities/Idea";
import { getSupabaseClient } from "@infrastructure/api/supabaseClient";

/**
 * Real implementation of IIdeaRepository against the `ideas` table
 * (see supabase/migrations/0002_phase3_ideas.sql and
 * 0003_phase3_entry_date.sql). Covers IDEA-001 core fields plus the
 * date-driven navigation model (CAL-001, AD-009) — rich content blocks,
 * subtasks, milestones, and file attachments are separate follow-ups
 * (see docs/ROADMAP.md).
 *
 * RLS scopes every row to workspace membership — this class never filters
 * by user/workspace id itself (see docs/AUTHORIZATION.md).
 */

interface IdeaRow {
  id: string;
  workspace_id: string;
  owner_id: string;
  title: string;
  description: string | null;
  icon: string | null;
  cover_image_url: string | null;
  status: IdeaStatus;
  priority: IdeaPriority;
  category_id: string | null;
  tag_ids: string[];
  deadline: string | null;
  entry_date: string;
  version: number;
  created_at: string;
  updated_at: string;
}

function mapRow(row: IdeaRow): Idea {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description,
    icon: row.icon,
    coverImageUrl: row.cover_image_url,
    status: row.status,
    priority: row.priority,
    categoryId: row.category_id,
    tagIds: row.tag_ids ?? [],
    deadline: row.deadline,
    entryDate: row.entry_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version,
  };
}

export class SupabaseIdeaRepository implements IIdeaRepository {
  private client = getSupabaseClient();

  async getById(id: string): Promise<Idea | null> {
    const { data, error } = await this.client
      .from("ideas")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw error;
    return data ? mapRow(data as IdeaRow) : null;
  }

  async listByWorkspace(workspaceId: string): Promise<Idea[]> {
    const { data, error } = await this.client
      .from("ideas")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as IdeaRow[]).map(mapRow);
  }

  async listByWorkspaceAndDate(workspaceId: string, entryDate: string): Promise<Idea[]> {
    const { data, error } = await this.client
      .from("ideas")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("entry_date", entryDate)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as IdeaRow[]).map(mapRow);
  }

  async create(idea: Omit<Idea, "id" | "createdAt" | "updatedAt" | "version">): Promise<Idea> {
    const { data, error } = await this.client
      .from("ideas")
      .insert({
        workspace_id: idea.workspaceId,
        owner_id: idea.ownerId,
        title: idea.title,
        description: idea.description,
        icon: idea.icon,
        cover_image_url: idea.coverImageUrl,
        status: idea.status,
        priority: idea.priority,
        category_id: idea.categoryId,
        tag_ids: idea.tagIds,
        deadline: idea.deadline,
        entry_date: idea.entryDate,
      })
      .select("*")
      .single();
    if (error) throw error;
    return mapRow(data as IdeaRow);
  }

  async update(id: string, changes: Partial<Omit<Idea, "entryDate">>): Promise<Idea> {
    // NOTE: optimistic-concurrency via `version` is intentionally not
    // enforced yet — same known gap as before (see docs/CHANGELOG.md).
    const patch: Record<string, unknown> = {};
    if (changes.title !== undefined) patch.title = changes.title;
    if (changes.description !== undefined) patch.description = changes.description;
    if (changes.icon !== undefined) patch.icon = changes.icon;
    if (changes.coverImageUrl !== undefined) patch.cover_image_url = changes.coverImageUrl;
    if (changes.status !== undefined) patch.status = changes.status;
    if (changes.priority !== undefined) patch.priority = changes.priority;
    if (changes.categoryId !== undefined) patch.category_id = changes.categoryId;
    if (changes.tagIds !== undefined) patch.tag_ids = changes.tagIds;
    if (changes.deadline !== undefined) patch.deadline = changes.deadline;

    const { data, error } = await this.client.from("ideas").update(patch).eq("id", id).select("*").single();
    if (error) throw error;
    return mapRow(data as IdeaRow);
  }

  async softDelete(id: string): Promise<void> {
    const { error } = await this.client.from("ideas").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
  }

  async moveToDate(id: string, newEntryDate: string): Promise<Idea> {
    const { data, error } = await this.client.rpc("move_idea_to_date", {
      p_idea_id: id,
      p_new_entry_date: newEntryDate,
    });
    if (error) throw error;
    return mapRow(data as IdeaRow);
  }

  async copyToDate(id: string, newEntryDate: string): Promise<Idea> {
    const { data, error } = await this.client.rpc("copy_idea_to_date", {
      p_idea_id: id,
      p_new_entry_date: newEntryDate,
    });
    if (error) throw error;
    return mapRow(data as IdeaRow);
  }
}
