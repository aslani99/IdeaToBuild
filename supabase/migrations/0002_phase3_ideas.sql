-- Phase 3 — Idea Management (core fields; rich content/subtasks/files/etc.
-- arrive incrementally — see docs/ROADMAP.md and docs/PRODUCT_SPEC.md).
-- Depends on 0001_phase2_core_domain.sql (workspaces, workspace_members).

-- ─────────────────────────────────────────────────────────────────────────
-- ideas
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  icon text,
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft', 'active', 'in_progress', 'on_hold', 'completed', 'archived')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  category_id uuid references public.categories(id) on delete set null,
  tag_ids uuid[] not null default '{}',
  deadline timestamptz,
  version integer not null default 1,
  deleted_at timestamptz, -- soft delete / trash (see docs/ROADMAP.md, Phase 11)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.ideas is
  'Central entity of the product (docs/PRODUCT_SPEC.md, IDEA-001). This migration covers core fields only — subtasks, milestones, file attachments, calendar links, and rich content blocks are separate tables added in later Phase 3 iterations.';

create index if not exists ideas_workspace_id_idx on public.ideas (workspace_id) where deleted_at is null;

drop trigger if exists trg_ideas_updated_at on public.ideas;
create trigger trg_ideas_updated_at
  before update on public.ideas
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security — same membership model as workspaces/categories/tags
-- (see 0001_phase2_core_domain.sql). Any workspace member can read/write;
-- ownership-based restrictions (e.g. only the creator can delete) can be
-- tightened in a later phase if the product spec requires it.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.ideas enable row level security;

create policy "ideas_all_member" on public.ideas
  for all using (
    exists (
      select 1 from public.workspace_members m
      where m.workspace_id = ideas.workspace_id and m.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.workspace_members m
      where m.workspace_id = ideas.workspace_id and m.user_id = auth.uid()
    )
  );
