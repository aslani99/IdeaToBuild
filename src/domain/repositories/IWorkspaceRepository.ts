import type { Workspace, WorkspaceMember } from "@domain/entities/Workspace";

/**
 * Domain-level repository interface.
 *
 * The UI and application layer depend on THIS interface only — never on a
 * concrete implementation (Supabase, SQLite, etc). This keeps the domain
 * portable across Desktop, Web, and Mobile (see docs/ARCHITECTURE.md, AD-006).
 */
export interface IWorkspaceRepository {
  getById(id: string): Promise<Workspace | null>;
  listForCurrentUser(): Promise<Workspace[]>;
  create(params: { name: string; icon?: string | null; isPersonal?: boolean }): Promise<Workspace>;
  update(id: string, changes: Partial<Pick<Workspace, "name" | "icon">>): Promise<Workspace>;
  delete(id: string): Promise<void>;
  listMembers(workspaceId: string): Promise<WorkspaceMember[]>;
}
