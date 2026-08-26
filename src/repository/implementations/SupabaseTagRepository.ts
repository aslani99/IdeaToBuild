import type { ITagRepository } from "@domain/repositories/ITagRepository";
import type { Tag } from "@domain/entities/Tag";
import { getSupabaseClient } from "@infrastructure/api/supabaseClient";

interface TagRow {
  id: string;
  workspace_id: string;
  name: string;
  color: string | null;
  created_at: string;
}

function mapTag(row: TagRow): Tag {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
  };
}

/**
 * Concrete implementation of ITagRepository backed by Supabase/Postgres.
 * RLS (supabase/migrations/0001_phase2_core_domain.sql) restricts rows to
 * workspaces the current user is a member of.
 */
export class SupabaseTagRepository implements ITagRepository {
  private client = getSupabaseClient();

  async listByWorkspace(workspaceId: string): Promise<Tag[]> {
    const { data, error } = await this.client
      .from("tags")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("name", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapTag);
  }

  async create(tag: Omit<Tag, "id" | "createdAt">): Promise<Tag> {
    const { data, error } = await this.client
      .from("tags")
      .insert({ workspace_id: tag.workspaceId, name: tag.name, color: tag.color })
      .select()
      .single();
    if (error) throw error;
    return mapTag(data);
  }

  async update(id: string, changes: Partial<Pick<Tag, "name" | "color">>): Promise<Tag> {
    const { data, error } = await this.client.from("tags").update(changes).eq("id", id).select().single();
    if (error) throw error;
    return mapTag(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from("tags").delete().eq("id", id);
    if (error) throw error;
  }
}
