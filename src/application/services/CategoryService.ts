import type { ICategoryRepository } from "@domain/repositories/ICategoryRepository";
import { createDraftCategory } from "@domain/entities/Category";
import type { Category } from "@domain/entities/Category";

/**
 * Application-layer use-case orchestration for Categories.
 * Depends only on the domain ICategoryRepository interface (see
 * docs/ARCHITECTURE.md).
 */
export class CategoryService {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async listCategories(workspaceId: string): Promise<Category[]> {
    return this.categoryRepository.listByWorkspace(workspaceId);
  }

  async createCategory(params: { workspaceId: string; name: string; color?: string | null; icon?: string | null }): Promise<Category> {
    const name = params.name.trim();
    if (!name) {
      throw new Error("Category name cannot be empty");
    }
    const draft = createDraftCategory({ ...params, name });
    return this.categoryRepository.create(draft);
  }

  async deleteCategory(id: string): Promise<void> {
    return this.categoryRepository.delete(id);
  }
}
