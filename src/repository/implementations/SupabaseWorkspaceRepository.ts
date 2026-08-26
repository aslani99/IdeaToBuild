import type { IWorkspaceRepository } from "@domain/repositories/IWorkspaceRepository";
import type { Workspace, WorkspaceMember, WorkspaceRole } from "@domain/entities/Workspace";
import { getSupabaseClient } from "@infrastructure/api/supabaseClient";

/**
 * Concrete implementation of IWorkspaceRepository backed by Supabase/Postgres.
 * Row Level Security (see supabase/migrations/0001_phase2_core_domain.sql)
 * guarantees a user can only ever see/modify workspaces they are a member
 * of — this class does not re-check membership client-side (see
 * docs/SECURITY.md, "هرگز اعتماد به ... ارسالی از کلاینت").
 */

interface WorkspaceRow {
  id: string;
  owner_id: string;
  name: string;
  icon: string | null;
  is_personal: boolean;
  created_at: string;
  updated_at: string;
}

interface WorkspaceMemberRow {
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  joined_at: string;
}

function mapWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    icon: row.icon,
    isPersonal: row.is_personal,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMember(row: WorkspaceMemberRow): WorkspaceMember {
  return {
    workspaceId: row.workspace_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at,
  };
}

export class SupabaseWorkspaceRepository implements IWorkspaceRepository {
  private client = getSupabaseClient();

  async getById(id: string): Promise<Workspace | null> {
    const { data, error } = await this.client.from("workspaces").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? mapWorkspace(data) : null;
  }

  async listForCurrentUser(): Promise<Workspace[]> {
    // RLS restricts this to workspaces the current auth.uid() is a member of.
    const { data, error } = await this.client
      .from("workspaces")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapWorkspace);
  }

  async create(params: { name: string; icon?: string | null; isPersonal?: boolean }): Promise<Workspace> {
    // Uses the security-definer RPC so the workspace and its owner
    // membership row are created atomically (see the migration file).
    const { data, error } = await this.client.rpc("create_workspace_with_owner", {
      p_name: params.name,
      p_icon: params.icon ?? null,
      p_is_personal: params.isPersonal ?? false,
    });
    if (error) throw error;
    return mapWorkspace(data as WorkspaceRow);
  }

  async update(id: string, changes: Partial<Pick<Workspace, "name" | "icon">>): Promise<Workspace> {
    const { data, error } = await this.client
      .from("workspaces")
      .update({ name: changes.name, icon: changes.icon })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapWorkspace(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from("workspaces").delete().eq("id", id);
    if (error) throw error;
  }

  async listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const { data, error } = await this.client
      .from("workspace_members")
      .select("*")
      .eq("workspace_id", workspaceId);
    if (error) throw error;
    return (data ?? []).map(mapMember);
  }
}
