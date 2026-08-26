import type { ITagRepository } from "@domain/repositories/ITagRepository";
import { createDraftTag } from "@domain/entities/Tag";
import type { Tag } from "@domain/entities/Tag";

/**
 * Application-layer use-case orchestration for Tags.
 * Depends only on the domain ITagRepository interface (see
 * docs/ARCHITECTURE.md).
 */
export class TagService {
  constructor(private readonly tagRepository: ITagRepository) {}

  async listTags(workspaceId: string): Promise<Tag[]> {
    return this.tagRepository.listByWorkspace(workspaceId);
  }

  async createTag(params: { workspaceId: string; name: string; color?: string | null }): Promise<Tag> {
    const name = params.name.trim();
    if (!name) {
      throw new Error("Tag name cannot be empty");
    }
    const draft = createDraftTag({ ...params, name });
    return this.tagRepository.create(draft);
  }

  async deleteTag(id: string): Promise<void> {
    return this.tagRepository.delete(id);
  }
}
