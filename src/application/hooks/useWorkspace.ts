import { useCallback, useMemo, useState } from "react";
import { WorkspaceService } from "@application/services/WorkspaceService";
import { CategoryService } from "@application/services/CategoryService";
import { TagService } from "@application/services/TagService";
import { SupabaseWorkspaceRepository } from "@repository/implementations/SupabaseWorkspaceRepository";
import { SupabaseCategoryRepository } from "@repository/implementations/SupabaseCategoryRepository";
import { SupabaseTagRepository } from "@repository/implementations/SupabaseTagRepository";
import type { Workspace } from "@domain/entities/Workspace";
import type { Category } from "@domain/entities/Category";
import type { Tag } from "@domain/entities/Tag";

/**
 * Thin React adapter over WorkspaceService/CategoryService/TagService.
 * Components should use this hook instead of importing the services or
 * repositories directly, so the Presentation layer stays decoupled from
 * wiring (see docs/ARCHITECTURE.md). Only usable for an authenticated user —
 * guests have no Supabase-backed workspace (see AUTH-005, guest data
 * migration, planned for Phase 9).
 */
export function useWorkspace() {
  // NOTE: as with useAuth (Phase 1), this instantiates repositories/services
  // directly. Replace with a composition-root/DI approach once one exists.
  const workspaceService = useMemo(() => new WorkspaceService(new SupabaseWorkspaceRepository()), []);
  const categoryService = useMemo(() => new CategoryService(new SupabaseCategoryRepository()), []);
  const tagService = useMemo(() => new TagService(new SupabaseTagRepository()), []);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspaceDetails = useCallback(
    async (workspace: Workspace) => {
      const [cats, tgs] = await Promise.all([
        categoryService.listCategories(workspace.id),
        tagService.listTags(workspace.id),
      ]);
      setCategories(cats);
      setTags(tgs);
    },
    [categoryService, tagService]
  );

  /**
   * Loads the current user's workspaces, creating a default personal
   * workspace on first run if none exist yet.
   */
  const initWorkspaces = useCallback(
    async (defaultName: string) => {
      setLoading(true);
      setError(null);
      try {
        const list = await workspaceService.listWorkspaces();
        const resolved =
          list.length > 0 ? list : [await workspaceService.createWorkspace({ name: defaultName, isPersonal: true })];
        const first = resolved[0];
        if (!first) {
          throw new Error("Failed to resolve a workspace");
        }
        setWorkspaces(resolved);
        setActiveWorkspace(first);
        await loadWorkspaceDetails(first);
        return resolved;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [workspaceService, loadWorkspaceDetails]
  );

  const createWorkspace = useCallback(
    async (name: string) => {
      setLoading(true);
      setError(null);
      try {
        const created = await workspaceService.createWorkspace({ name });
        setWorkspaces((prev) => [...prev, created]);
        setActiveWorkspace(created);
        await loadWorkspaceDetails(created);
        return created;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [workspaceService, loadWorkspaceDetails]
  );

  const selectWorkspace = useCallback(
    async (workspace: Workspace) => {
      setActiveWorkspace(workspace);
      await loadWorkspaceDetails(workspace);
    },
    [loadWorkspaceDetails]
  );

  const createCategory = useCallback(
    async (name: string) => {
      if (!activeWorkspace) throw new Error("No active workspace");
      const created = await categoryService.createCategory({ workspaceId: activeWorkspace.id, name });
      setCategories((prev) => [...prev, created]);
      return created;
    },
    [categoryService, activeWorkspace]
  );

  const createTag = useCallback(
    async (name: string) => {
      if (!activeWorkspace) throw new Error("No active workspace");
      const created = await tagService.createTag({ workspaceId: activeWorkspace.id, name });
      setTags((prev) => [...prev, created]);
      return created;
    },
    [tagService, activeWorkspace]
  );

  return {
    workspaces,
    activeWorkspace,
    categories,
    tags,
    loading,
    error,
    initWorkspaces,
    createWorkspace,
    selectWorkspace,
    createCategory,
    createTag,
  };
}
