import type { Idea } from "@domain/entities/Idea";

/**
 * A narrow interface just for the sync path (docs/DECISIONS.md AD-010):
 * push the full current state of a locally-modified Idea up to whatever
 * cloud backend is configured. Kept separate from IIdeaRepository because
 * "push this exact snapshot" is a different operation from the normal
 * create/update/delete vocabulary the rest of the app uses — it always
 * writes the COMPLETE row (an upsert), including entryDate, since with
 * local-first the local device is the source of truth and the cloud is a
 * mirror, not the other way around.
 */
export interface IIdeaSyncTarget {
  /**
   * @param deleted whether this snapshot represents a soft-deleted record
   * (maps to the server's `deleted_at` column) — the local store tracks
   * deletion as a boolean flag, not a timestamp, so the sync path is
   * responsible for turning it into a real timestamp on push.
   */
  pushSnapshot(idea: Idea, deleted: boolean): Promise<void>;
}
