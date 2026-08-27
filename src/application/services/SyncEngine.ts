import type { IIdeaSyncTarget } from "@domain/repositories/IIdeaSyncTarget";
import type { Idea } from "@domain/entities/Idea";
import { getPendingLocalIdeas, markLocalIdeaSynced, type LocalIdeaRow } from "@infrastructure/db/localIdeaStore";

/**
 * Pushes locally-queued changes up to the cloud in the background
 * (docs/DECISIONS.md AD-010). The UI never waits on this — every write
 * already completed locally via LocalFirstIdeaRepository before this ever
 * runs.
 *
 * Trigger conditions: the browser's `online` event, plus a periodic
 * interval (so a connection that was already up when the app started
 * still gets synced, not just reconnections). A short debounce avoids
 * hammering the network right as connectivity flaps.
 *
 * Known gap (documented, not hidden): if a push fails partway through the
 * pending list (e.g. connection drops mid-sync), the remaining rows simply
 * stay queued for the next trigger — there's no per-row retry/backoff
 * schedule yet. For the volumes expected at this stage (a single personal
 * workspace) this is an acceptable simplification, revisit before
 * multi-device use becomes common (see docs/SYNC.md, planned Phase 10).
 */
export class SyncEngine {
  private timer: ReturnType<typeof setInterval> | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private syncing = false;

  constructor(private readonly syncTarget: IIdeaSyncTarget, private readonly intervalMs = 20000) {}

  start(): void {
    window.addEventListener("online", this.scheduleSyncSoon);
    this.timer = setInterval(() => {
      if (navigator.onLine) this.scheduleSyncSoon();
    }, this.intervalMs);
    // Try once shortly after startup too, in case we're already online.
    this.scheduleSyncSoon();
  }

  stop(): void {
    window.removeEventListener("online", this.scheduleSyncSoon);
    if (this.timer) clearInterval(this.timer);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }

  private scheduleSyncSoon = () => {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => void this.syncNow(), 3000);
  };

  async syncNow(): Promise<void> {
    if (this.syncing || !navigator.onLine) return;
    this.syncing = true;
    try {
      const pending = await getPendingLocalIdeas();
      for (const row of pending) {
        try {
          await this.syncTarget.pushSnapshot(rowToIdea(row), row.deleted);
          await markLocalIdeaSynced(row.id);
        } catch {
          // Leave this (and any later) row queued — stop here rather than
          // pushing out of order; the next trigger will retry from scratch.
          break;
        }
      }
    } finally {
      this.syncing = false;
    }
  }
}

function rowToIdea(row: LocalIdeaRow): Idea {
  const p = row.payload as Record<string, unknown>;
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    ownerId: p.ownerId as string,
    title: p.title as string,
    description: (p.description as string | null) ?? null,
    icon: (p.icon as string | null) ?? null,
    coverImageUrl: (p.coverImageUrl as string | null) ?? null,
    status: p.status as Idea["status"],
    priority: p.priority as Idea["priority"],
    categoryId: (p.categoryId as string | null) ?? null,
    tagIds: (p.tagIds as string[]) ?? [],
    deadline: (p.deadline as string | null) ?? null,
    entryDate: row.entryDate,
    createdAt: p.createdAt as string,
    updatedAt: row.updatedAt,
    version: p.version as number,
  };
}
