/**
 * Domain entity: Tag
 *
 * Pure TypeScript — no React, no Supabase, no Tauri imports allowed here.
 * Tags belong to a Workspace and can be attached to multiple resource types
 * (Ideas, Projects, Notes, ...) — see docs/PRODUCT_SPEC.md.
 */

export interface Tag {
  id: string;
  workspaceId: string;
  name: string;
  color: string | null;
  createdAt: string; // ISO 8601
}

export function createDraftTag(params: {
  workspaceId: string;
  name: string;
  color?: string | null;
}): Omit<Tag, "id" | "createdAt"> {
  return {
    workspaceId: params.workspaceId,
    name: params.name,
    color: params.color ?? null,
  };
}
