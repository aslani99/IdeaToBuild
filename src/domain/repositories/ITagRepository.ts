import type { Tag } from "@domain/entities/Tag";

/**
 * Domain-level repository interface — see docs/ARCHITECTURE.md, AD-006.
 */
export interface ITagRepository {
  listByWorkspace(workspaceId: string): Promise<Tag[]>;
  create(tag: Omit<Tag, "id" | "createdAt">): Promise<Tag>;
  update(id: string, changes: Partial<Pick<Tag, "name" | "color">>): Promise<Tag>;
  delete(id: string): Promise<void>;
}
