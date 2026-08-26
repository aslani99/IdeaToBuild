import { useCallback, useEffect, useMemo, useState } from "react";
import { IdeaService } from "@application/services/IdeaService";
import { SupabaseIdeaRepository } from "@repository/implementations/SupabaseIdeaRepository";
import type { Idea } from "@domain/entities/Idea";

/**
 * Thin React adapter over IdeaService (mirrors useAuth/useWorkspace — see
 * docs/ARCHITECTURE.md). Scoped to a single workspace at a time; the caller
 * (DashboardPage) re-invokes this with the active workspace's id.
 */
export function useIdeas(workspaceId: string | null, ownerId: string | null) {
  const ideaService = useMemo(() => new IdeaService(new SupabaseIdeaRepository()), []);

  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      setIdeas([]);
      return;
    }
    setLoading(true);
    setError(null);
    ideaService
      .listIdeas(workspaceId)
      .then(setIdeas)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [workspaceId, ideaService]);

  const createIdea = useCallback(
    async (title: string) => {
      if (!workspaceId || !ownerId) throw new Error("No active workspace/user");
      const created = await ideaService.createIdea({ workspaceId, ownerId, title });
      setIdeas((prev) => [created, ...prev]);
      return created;
    },
    [ideaService, workspaceId, ownerId]
  );

  const updateIdea = useCallback(
    async (id: string, changes: Partial<Idea>) => {
      const updated = await ideaService.updateIdea(id, changes);
      setIdeas((prev) => prev.map((i) => (i.id === id ? updated : i)));
      return updated;
    },
    [ideaService]
  );

  const deleteIdea = useCallback(
    async (id: string) => {
      await ideaService.deleteIdea(id);
      setIdeas((prev) => prev.filter((i) => i.id !== id));
    },
    [ideaService]
  );

  return { ideas, loading, error, createIdea, updateIdea, deleteIdea };
}
