import { useCallback, useEffect, useMemo, useState } from "react";
import { IdeaService } from "@application/services/IdeaService";
import { SupabaseIdeaRepository } from "@repository/implementations/SupabaseIdeaRepository";
import { useActiveDate } from "@application/context/ActiveDateContext";
import type { Idea } from "@domain/entities/Idea";

/**
 * Thin React adapter over IdeaService (mirrors useAuth/useWorkspace — see
 * docs/ARCHITECTURE.md). Scoped to a single workspace AND the app's global
 * active date (CAL-001, AD-009) — re-fetches whenever either changes.
 */
export function useIdeas(workspaceId: string | null, ownerId: string | null) {
  const ideaService = useMemo(() => new IdeaService(new SupabaseIdeaRepository()), []);
  const { activeDate } = useActiveDate();

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
      .listIdeasForDate(workspaceId, activeDate)
      .then(setIdeas)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [workspaceId, activeDate, ideaService]);

  const createIdea = useCallback(
    async (title: string) => {
      if (!workspaceId || !ownerId) throw new Error("No active workspace/user");
      const created = await ideaService.createIdea({ workspaceId, ownerId, title, entryDate: activeDate });
      // Only add to the visible list if it belongs to the day we're looking at
      // (it always will, since we just created it with entryDate = activeDate,
      // but this guards against a future caller passing a different date).
      if (created.entryDate === activeDate) {
        setIdeas((prev) => [created, ...prev]);
      }
      return created;
    },
    [ideaService, workspaceId, ownerId, activeDate]
  );

  const updateIdea = useCallback(
    async (id: string, changes: Partial<Omit<Idea, "entryDate">>) => {
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

  const moveIdea = useCallback(
    async (id: string, newEntryDate: string) => {
      await ideaService.moveIdeaToDate(id, newEntryDate);
      // The record now belongs to a different day, so it disappears from
      // today's list — no need to keep it in local state.
      setIdeas((prev) => prev.filter((i) => i.id !== id));
    },
    [ideaService]
  );

  const copyIdea = useCallback(
    async (id: string, newEntryDate: string) => {
      // The copy lives on newEntryDate, not the day we're currently viewing,
      // so it's intentionally not added to the visible list here.
      return ideaService.copyIdeaToDate(id, newEntryDate);
    },
    [ideaService]
  );

  return { ideas, loading, error, createIdea, updateIdea, deleteIdea, moveIdea, copyIdea };
}
