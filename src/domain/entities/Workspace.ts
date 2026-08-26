/**
 * Domain entity: Workspace
 *
 * Pure TypeScript — no React, no Supabase, no Tauri imports allowed here.
 * A Workspace is the container for a user's Ideas/Projects/Tasks/Notes/Files
 * (see docs/PRODUCT_SPEC.md, "مدل Workspace"). Even the single-user edition
 * models workspaces with explicit membership so multi-member workspaces
 * (Phase 17+) need no schema or entity migration.
 */

export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

export interface Workspace {
  id: string;
  ownerId: string;
  name: string;
  icon: string | null;
  isPersonal: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: string; // ISO 8601
}

export function isWorkspaceEditableBy(role: WorkspaceRole): boolean {
  return role === "owner" || role === "admin";
}
