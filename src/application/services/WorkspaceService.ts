import type { IWorkspaceRepository } from "@domain/repositories/IWorkspaceRepository";
import type { Workspace, WorkspaceMember } from "@domain/entities/Workspace";

/**
 * Application-layer use-case orchestration for Workspaces.
 * Depends only on the domain IWorkspaceRepository interface — never on a
 * concrete repository implementation (see docs/ARCHITECTURE.md).
 */
export class WorkspaceService {
  constructor(private readonly workspaceRepository: IWorkspaceRepository) {}

  async listWorkspaces(): Promise<Workspace[]> {
    return this.workspaceRepository.listForCurrentUser();
  }

  async createWorkspace(params: { name: string; icon?: string | null; isPersonal?: boolean }): Promise<Workspace> {
    const name = params.name.trim();
    if (!name) {
      throw new Error("Workspace name cannot be empty");
    }
    return this.workspaceRepository.create({ ...params, name });
  }

  async renameWorkspace(id: string, name: string): Promise<Workspace> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error("Workspace name cannot be empty");
    }
    return this.workspaceRepository.update(id, { name: trimmed });
  }

  async deleteWorkspace(id: string): Promise<void> {
    return this.workspaceRepository.delete(id);
  }

  async listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return this.workspaceRepository.listMembers(workspaceId);
  }

  /**
   * Ensures the current user has at least one workspace, creating a default
   * personal workspace if none exist yet. Called on first app load after
   * sign-in (see AUTH-00x flow in docs/REQUIREMENTS_TRACEABILITY.md).
   */
  async ensureDefaultWorkspace(defaultName: string): Promise<Workspace> {
    const existing = await this.listWorkspaces();
    const first = existing[0];
    if (first) {
      return first;
    }
    return this.createWorkspace({ name: defaultName, isPersonal: true });
  }
}
