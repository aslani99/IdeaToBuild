import type { Idea } from "@domain/entities/Idea";

/**
 * Domain-level repository interface.
 *
 * The UI and application layer depend on THIS interface only — never on a
 * concrete implementation (Supabase, SQLite, etc). This keeps the domain
 * portable across Desktop, Web, and Mobile (see docs/ARCHITECTURE.md, AD-006).
 */
export interface IIdeaRepository {
  getById(id: string): Promise<Idea | null>;
  listByWorkspace(workspaceId: string): Promise<Idea[]>;
  create(idea: Omit<Idea, "id" | "createdAt" | "updatedAt" | "version">): Promise<Idea>;
  update(id: string, changes: Partial<Idea>): Promise<Idea>;
  softDelete(id: string): Promise<void>;
}
