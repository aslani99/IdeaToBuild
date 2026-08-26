import type { IIdeaRepository } from "@domain/repositories/IIdeaRepository";
import { createDraftIdea } from "@domain/entities/Idea";
import type { Idea } from "@domain/entities/Idea";

/**
 * Application-layer use-case orchestration for Ideas.
 * Depends only on the domain IIdeaRepository interface — never on a concrete
 * repository implementation (see docs/ARCHITECTURE.md).
 */
export class IdeaService {
  constructor(private readonly ideaRepository: IIdeaRepository) {}

  async createIdea(params: { workspaceId: string; ownerId: string; title: string; entryDate: string }): Promise<Idea> {
    const title = params.title.trim();
    if (!title) throw new Error("Idea title cannot be empty");
    const draft = createDraftIdea({ ...params, title });
    return this.ideaRepository.create(draft);
  }

  /** Lists ideas for a specific day — the primary read path (CAL-001, AD-009). */
  async listIdeasForDate(workspaceId: string, entryDate: string): Promise<Idea[]> {
    return this.ideaRepository.listByWorkspaceAndDate(workspaceId, entryDate);
  }

  async listIdeas(workspaceId: string): Promise<Idea[]> {
    return this.ideaRepository.listByWorkspace(workspaceId);
  }

  async updateIdea(id: string, changes: Partial<Omit<Idea, "entryDate">>): Promise<Idea> {
    return this.ideaRepository.update(id, changes);
  }

  async deleteIdea(id: string): Promise<void> {
    return this.ideaRepository.softDelete(id);
  }

  /** Moves the record itself to a new day — the original stops appearing on its old day. */
  async moveIdeaToDate(id: string, newEntryDate: string): Promise<Idea> {
    return this.ideaRepository.moveToDate(id, newEntryDate);
  }

  /** Duplicates the idea under a new day — the original is left untouched. */
  async copyIdeaToDate(id: string, newEntryDate: string): Promise<Idea> {
    return this.ideaRepository.copyToDate(id, newEntryDate);
  }
}
