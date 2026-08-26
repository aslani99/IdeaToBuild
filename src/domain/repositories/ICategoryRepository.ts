import type { Category } from "@domain/entities/Category";

/**
 * Domain-level repository interface — see docs/ARCHITECTURE.md, AD-006.
 */
export interface ICategoryRepository {
  listByWorkspace(workspaceId: string): Promise<Category[]>;
  create(category: Omit<Category, "id" | "createdAt" | "updatedAt">): Promise<Category>;
  update(id: string, changes: Partial<Pick<Category, "name" | "color" | "icon">>): Promise<Category>;
  delete(id: string): Promise<void>;
}
