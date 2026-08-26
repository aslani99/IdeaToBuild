/**
 * Domain entity: Category
 *
 * Pure TypeScript — no React, no Supabase, no Tauri imports allowed here.
 * Categories belong to a Workspace and are used to organize Ideas/Projects
 * (see docs/PRODUCT_SPEC.md).
 */

export interface Category {
  id: string;
  workspaceId: string;
  name: string;
  color: string | null;
  icon: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export function createDraftCategory(params: {
  workspaceId: string;
  name: string;
  color?: string | null;
  icon?: string | null;
}): Omit<Category, "id" | "createdAt" | "updatedAt"> {
  return {
    workspaceId: params.workspaceId,
    name: params.name,
    color: params.color ?? null,
    icon: params.icon ?? null,
  };
}
