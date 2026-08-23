/**
 * Domain entity: Idea
 *
 * Pure TypeScript — no React, no Supabase, no Tauri imports allowed here.
 * This is the central entity of the product (see docs/PRODUCT_SPEC.md, IDEA-001).
 */

export type IdeaStatus = "draft" | "active" | "in_progress" | "on_hold" | "completed" | "archived";
export type IdeaPriority = "low" | "medium" | "high" | "urgent";

export interface Idea {
  id: string;
  workspaceId: string;
  ownerId: string;
  title: string;
  description: string | null;
  icon: string | null;
  coverImageUrl: string | null;
  status: IdeaStatus;
  priority: IdeaPriority;
  categoryId: string | null;
  tagIds: string[];
  deadline: string | null; // ISO 8601
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  version: number;
}

export function createDraftIdea(params: {
  workspaceId: string;
  ownerId: string;
  title: string;
}): Omit<Idea, "id" | "createdAt" | "updatedAt" | "version"> {
  return {
    workspaceId: params.workspaceId,
    ownerId: params.ownerId,
    title: params.title,
    description: null,
    icon: null,
    coverImageUrl: null,
    status: "draft",
    priority: "medium",
    categoryId: null,
    tagIds: [],
    deadline: null,
  };
}
