import type { Idea } from "@domain/entities/Idea";

/**
 * Domain-level repository interface.
 *
 * The UI and application layer depend on THIS interface only — never on a
 * concrete implementation (Supabase, SQLite, etc). This keeps the domain
 * portable across Desktop, Web, and Mobile (see docs/ARCHITECTURE.md, AD-006).
 */
export interface IIdeaRepository {
  getById(id: string): Promise<Idea | null>;
  listByWorkspace(workspaceId: string): Promise<Idea[]>;

  /**
   * The primary read path for the date-driven navigation model (CAL-001,
   * AD-009): returns only ideas whose entryDate matches the given day.
   */
  listByWorkspaceAndDate(workspaceId: string, entryDate: string): Promise<Idea[]>;

  create(idea: Omit<Idea, "id" | "createdAt" | "updatedAt" | "version">): Promise<Idea>;

  /**
   * Updates any field EXCEPT entryDate — entryDate is intentionally not
   * accepted here. Use moveToDate to change which day a record belongs to
   * (see docs/PRODUCT_SPEC.md, AD-009 — entryDate is not edited in place).
   */
  update(id: string, changes: Partial<Omit<Idea, "entryDate">>): Promise<Idea>;

  softDelete(id: string): Promise<void>;

  /** Moves an existing idea to a different entryDate (the record itself, not a copy). */
  moveToDate(id: string, newEntryDate: string): Promise<Idea>;

  /** Creates a duplicate of an existing idea under a different entryDate; the original is untouched. */
  copyToDate(id: string, newEntryDate: string): Promise<Idea>;
}
