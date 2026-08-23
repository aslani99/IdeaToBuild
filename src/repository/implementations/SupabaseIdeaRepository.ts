import type { IIdeaRepository } from "@domain/repositories/IIdeaRepository";
import type { Idea } from "@domain/entities/Idea";
import { getSupabaseClient } from "@infrastructure/api/supabaseClient";

/**
 * Concrete implementation of IIdeaRepository backed by Supabase/Postgres.
 *
 * NOTE (Phase 0): this is a structural placeholder. Real queries, RLS-aware
 * error handling, and mapping between DB rows and the Idea entity will be
 * implemented in Phase 3 (see docs/ROADMAP.md, IDEA-001 in
 * docs/REQUIREMENTS_TRACEABILITY.md). Do NOT ship this as-is without
 * implementing real persistence — see docs/PROJECT_MEMORY.md rule
 * "no fake implementations".
 */
export class SupabaseIdeaRepository implements IIdeaRepository {
  private client = getSupabaseClient();

  async getById(_id: string): Promise<Idea | null> {
    throw new Error("Not implemented yet — Phase 3 (IDEA-001)");
  }

  async listByWorkspace(_workspaceId: string): Promise<Idea[]> {
    throw new Error("Not implemented yet — Phase 3 (IDEA-001)");
  }

  async create(_idea: Omit<Idea, "id" | "createdAt" | "updatedAt" | "version">): Promise<Idea> {
    throw new Error("Not implemented yet — Phase 3 (IDEA-001)");
  }

  async update(_id: string, _changes: Partial<Idea>): Promise<Idea> {
    throw new Error("Not implemented yet — Phase 3 (IDEA-001)");
  }

  async softDelete(_id: string): Promise<void> {
    throw new Error("Not implemented yet — Phase 3 (IDEA-001)");
  }
}
