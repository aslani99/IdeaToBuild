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

  async createIdea(params: { workspaceId: string; ownerId: string; title: string }): Promise<Idea> {
    const draft = createDraftIdea(params);
    return this.ideaRepository.create(draft);
  }

  async listIdeas(workspaceId: string): Promise<Idea[]> {
    return this.ideaRepository.listByWorkspace(workspaceId);
  }
}
