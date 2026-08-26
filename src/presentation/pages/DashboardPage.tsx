import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useWorkspace } from "@application/hooks/useWorkspace";
import { useIdeas } from "@application/hooks/useIdeas";
import { IdeasPanel } from "@presentation/components/IdeasPanel";
import { DateNavigator } from "@presentation/components/DateNavigator";
import type { Workspace } from "@domain/entities/Workspace";

/**
 * Phase 2/3 entry surface: lets the authenticated user see/switch workspaces,
 * manage categories/tags, and manage Ideas within the active workspace AND
 * the app's currently active date (CAL-001, AD-009). Deliberately minimal —
 * Notes/Projects/Calendar/Files arrive in later phases (see docs/ROADMAP.md).
 */
export function DashboardPage({ ownerId }: { ownerId: string }) {
  const { t } = useTranslation();
  const {
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
  } = useWorkspace();

  const {
    ideas,
    loading: ideasLoading,
    error: ideasError,
    createIdea,
    deleteIdea,
    moveIdea,
    copyIdea,
  } = useIdeas(activeWorkspace?.id ?? null, ownerId);

  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newTagName, setNewTagName] = useState("");

  useEffect(() => {
    initWorkspaces(t("workspace.defaultName"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    await createWorkspace(newWorkspaceName.trim());
    setNewWorkspaceName("");
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    await createCategory(newCategoryName.trim());
    setNewCategoryName("");
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    await createTag(newTagName.trim());
    setNewTagName("");
  };

  return (
    <section className="dashboard">
      <DateNavigator />
      {error && <p className="form-error">{error}</p>}
      {ideasError && <p className="form-error">{ideasError}</p>}

      <div className="dashboard-workspaces">
        <h2>{t("workspace.myWorkspaces")}</h2>
        <ul>
          {workspaces.map((ws: Workspace) => (
            <li key={ws.id}>
              <button
                onClick={() => selectWorkspace(ws)}
                aria-pressed={activeWorkspace?.id === ws.id}
                className={activeWorkspace?.id === ws.id ? "active" : undefined}
              >
                {ws.name}
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={handleCreateWorkspace}>
          <input
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            placeholder={t("workspace.namePlaceholder")}
          />
          <button type="submit" disabled={loading}>
            {t("workspace.create")}
          </button>
        </form>
      </div>

      {activeWorkspace && (
        <div className="dashboard-workspace-detail">
          <h3>{activeWorkspace.name}</h3>

          <div className="dashboard-categories">
            <h4>{t("workspace.categories")}</h4>
            {categories.length === 0 ? (
              <p>{t("workspace.noCategories")}</p>
            ) : (
              <ul>
                {categories.map((c) => (
                  <li key={c.id}>{c.name}</li>
                ))}
              </ul>
            )}
            <form onSubmit={handleCreateCategory}>
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder={t("workspace.namePlaceholderCategory")}
              />
              <button type="submit" disabled={loading}>
                {t("workspace.createCategory")}
              </button>
            </form>
          </div>

          <div className="dashboard-tags">
            <h4>{t("workspace.tags")}</h4>
            {tags.length === 0 ? (
              <p>{t("workspace.noTags")}</p>
            ) : (
              <ul>
                {tags.map((tg) => (
                  <li key={tg.id}>{tg.name}</li>
                ))}
              </ul>
            )}
            <form onSubmit={handleCreateTag}>
              <input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder={t("workspace.namePlaceholderTag")}
              />
              <button type="submit" disabled={loading}>
                {t("workspace.createTag")}
              </button>
            </form>
          </div>

          <IdeasPanel
            ideas={ideas}
            loading={ideasLoading}
            onCreate={createIdea}
            onDelete={deleteIdea}
            onMove={moveIdea}
            onCopy={copyIdea}
          />
        </div>
      )}
    </section>
  );
}
