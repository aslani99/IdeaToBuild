import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Idea } from "@domain/entities/Idea";

/**
 * Lists ideas for the app's currently active date (CAL-001, AD-009), with
 * create/delete/move/copy. Status/priority editing, rich content, subtasks,
 * files, and other views (Board/Calendar/Gantt/Graph — docs/PRODUCT_SPEC.md)
 * are deliberately out of scope for this slice — see docs/ROADMAP.md.
 */
export function IdeasPanel({
  ideas,
  loading,
  onCreate,
  onDelete,
  onMove,
  onCopy,
}: {
  ideas: Idea[];
  loading: boolean;
  onCreate: (title: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  onMove: (id: string, newEntryDate: string) => Promise<unknown>;
  onCopy: (id: string, newEntryDate: string) => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const [newTitle, setNewTitle] = useState("");
  // Which idea's move/copy date picker is currently open, and which action.
  const [pendingAction, setPendingAction] = useState<{ id: string; kind: "move" | "copy" } | null>(null);
  const [targetDate, setTargetDate] = useState("");

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await onCreate(newTitle.trim());
    setNewTitle("");
  }

  async function confirmPendingAction() {
    if (!pendingAction || !targetDate) return;
    if (pendingAction.kind === "move") {
      await onMove(pendingAction.id, targetDate);
    } else {
      await onCopy(pendingAction.id, targetDate);
    }
    setPendingAction(null);
    setTargetDate("");
  }

  return (
    <div className="dashboard-ideas">
      <h4>{t("idea.myIdeas")}</h4>
      {ideas.length === 0 ? (
        <p>{t("idea.noIdeas")}</p>
      ) : (
        <ul>
          {ideas.map((idea) => (
            <li key={idea.id}>
              <span>{idea.title}</span> <span className="idea-status">{t(`idea.status.${idea.status}`)}</span>{" "}
              <button onClick={() => setPendingAction({ id: idea.id, kind: "move" })}>{t("idea.move")}</button>{" "}
              <button onClick={() => setPendingAction({ id: idea.id, kind: "copy" })}>{t("idea.copy")}</button>{" "}
              <button onClick={() => onDelete(idea.id)}>{t("idea.delete")}</button>
              {pendingAction?.id === idea.id && (
                <div className="idea-date-picker">
                  <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
                  <button onClick={confirmPendingAction} disabled={!targetDate}>
                    {t("idea.confirm")}
                  </button>
                  <button onClick={() => setPendingAction(null)}>{t("idea.cancel")}</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleCreate}>
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={t("idea.namePlaceholder")} />
        <button type="submit" disabled={loading}>
          {t("idea.create")}
        </button>
      </form>
    </div>
  );
}
