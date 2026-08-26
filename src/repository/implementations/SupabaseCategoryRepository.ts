import type { ICategoryRepository } from "@domain/repositories/ICategoryRepository";
import type { Category } from "@domain/entities/Category";
import { getSupabaseClient } from "@infrastructure/api/supabaseClient";

interface CategoryRow {
  id: string;
  workspace_id: string;
  name: string;
  color: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Concrete implementation of ICategoryRepository backed by Supabase/Postgres.
 * RLS (supabase/migrations/0001_phase2_core_domain.sql) restricts rows to
 * workspaces the current user is a member of.
 */
export class SupabaseCategoryRepository implements ICategoryRepository {
  private client = getSupabaseClient();

  async listByWorkspace(workspaceId: string): Promise<Category[]> {
    const { data, error } = await this.client
      .from("categories")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("name", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapCategory);
  }

  async create(category: Omit<Category, "id" | "createdAt" | "updatedAt">): Promise<Category> {
    const { data, error } = await this.client
      .from("categories")
      .insert({
        workspace_id: category.workspaceId,
        name: category.name,
        color: category.color,
        icon: category.icon,
      })
      .select()
      .single();
    if (error) throw error;
    return mapCategory(data);
  }

  async update(id: string, changes: Partial<Pick<Category, "name" | "color" | "icon">>): Promise<Category> {
    const { data, error } = await this.client
      .from("categories")
      .update(changes)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapCategory(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from("categories").delete().eq("id", id);
    if (error) throw error;
  }
}
