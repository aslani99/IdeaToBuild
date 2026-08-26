import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Idea } from "@domain/entities/Idea";

/**
 * Phase 3 MVP: list ideas in the active workspace, create a new one (title
 * only), delete (soft) one. Status/priority editing, rich content, subtasks,
 * files, and other views (Board/Calendar/Gantt/Graph — docs/PRODUCT_SPEC.md)
 * are deliberately out of scope for this first slice — see docs/ROADMAP.md.
 */
export function IdeasPanel({
  ideas,
  loading,
  onCreate,
  onDelete,
}: {
  ideas: Idea[];
  loading: boolean;
  onCreate: (title: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const [newTitle, setNewTitle] = useState("");

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await onCreate(newTitle.trim());
    setNewTitle("");
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
              <span>{idea.title}</span>{" "}
              <span className="idea-status">{t(`idea.status.${idea.status}`)}</span>{" "}
              <button onClick={() => onDelete(idea.id)}>{t("idea.delete")}</button>
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
