# IdeaToBuild — Claude Code Instructions

## 1. Project Identity

IdeaToBuild is a secure personal platform for idea management, knowledge,
planning, files, and related productivity data.

Primary stack:
- React 18 + TypeScript
- Vite
- Tauri 2 + Rust
- Supabase/PostgreSQL/Auth/RLS
- Cloudflare R2 for object storage
- pnpm

Desktop is the first production target, but architecture must remain
cross-platform.

## 2. Source of Truth

Before important changes, consult:

- `docs/PROJECT_MEMORY.md`
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`

For the relevant task, consult the specific documentation instead of
loading every document.

Do not duplicate the contents of these documents into this file.

## 3. Non-Negotiable Rules

- Never add AI/LLM functionality to the production application.
- Never create fake, mocked, placeholder, or demo implementations when
  real functionality is required.
- Never rewrite an existing file blindly.
- Inspect dependencies and callers before changing public interfaces.
- Preserve existing behavior unless the requested change explicitly
  modifies that behavior.
- Do not silently remove existing functionality.
- Do not claim a feature is complete without verification.

## 4. Architecture

Maintain:

Presentation
→ Application
→ Domain
→ Repository
→ Infrastructure

Rules:

- Presentation must not directly query Supabase or other data sources.
- Domain must remain framework-independent.
- Domain must not import React, Supabase SDK, or Tauri APIs.
- Repository implements Domain repository interfaces.
- Infrastructure owns direct access to Supabase, R2, SQLite/IndexedDB,
  HTTP, and OS-specific services.

## 5. Database / Authorization

Supabase RLS is authoritative for authorization.

Never rely only on client-side checks for authorization.

For workspace membership and role checks, follow the established RLS
helper-function pattern documented in the project.

Do not introduce a new direct `workspace_members` self-query inside
RLS policies without first checking the existing recursion fix.

Never expose service-role credentials to frontend code.

## 6. Data Safety

Never destructively delete user data unless explicitly required.

Prefer soft-delete/reversible operations where the project architecture
requires them.

Do not modify or remove migrations that have already been used against
a real database. Add a new migration instead.

## 7. Date Model

The application uses an active-date model.

`entryDate` must not be changed through a generic update operation.

Moving an Idea to another date and copying an Idea to another date are
explicit operations.

Follow `CAL-001` / `AD-009`.

## 8. Local-First Architecture

Idea data currently follows the local-first path.

Do not bypass the established `LocalFirstIdeaRepository` and
`SyncEngine` architecture without explicit justification.

Any change involving local storage, encryption, synchronization, or
conflict handling requires checking the relevant architecture and ADR
documentation first.

## 9. Frontend

Use existing project components, hooks, services, repositories, and
design-system conventions before creating new abstractions.

Do not place business logic directly in presentation components.

Preserve i18n architecture. Do not hard-code user-facing strings when
a translation key should exist.

## 10. Tauri / Rust

Keep OS-specific functionality inside Tauri/Rust infrastructure.

Do not expose unrestricted filesystem or shell capabilities.

Follow the existing Tauri capability configuration and least-privilege
security model.

## 11. Package Manager

Use `pnpm`.

Do not introduce npm/yarn lockfiles.

Primary commands:

- `pnpm install`
- `pnpm dev`
- `pnpm build`
- `pnpm tauri dev`

Run the smallest relevant verification first, then broader verification
when appropriate.

## 12. Verification

After implementation:

1. Inspect the diff.
2. Run relevant type/build checks.
3. Run relevant application tests or manual verification.
4. Report anything that could not be verified.
5. Never claim success based only on code inspection.

## 13. Git

Do not reset, force-push, rebase shared history, or discard user changes
without explicit permission.

Before significant implementation work:

- inspect `git status`
- understand existing uncommitted changes
- preserve unrelated user changes

Create focused commits after verified milestones.

## 14. Change Discipline

Modify only files necessary for the requested task.

Do not perform unrelated refactors, dependency upgrades, formatting
rewrites, or architectural changes unless explicitly requested or
required to make the requested change correct.

## 15. Working Style

For non-trivial tasks:

1. Inspect relevant project state.
2. Identify affected layers/files.
3. Explain the implementation plan briefly.
4. Implement.
5. Verify.
6. Summarize changed files, verification, and remaining risks.

When requirements conflict with existing architecture, stop and identify
the conflict instead of silently choosing a destructive interpretation.