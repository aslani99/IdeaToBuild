-- Phase 2 — Core domain: Workspace, Workspace membership, Category, Tag
-- See docs/PRODUCT_SPEC.md ("مدل Workspace") and docs/ARCHITECTURE.md (AD-006).
-- Every table has RLS enabled — never trust a client-supplied user/workspace id
-- (docs/SECURITY.md, "تفویض اختیار").

-- ─────────────────────────────────────────────────────────────────────────
-- workspaces
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  icon text,
  is_personal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.workspaces is
  'A container for a user''s Ideas/Projects/Tasks/Notes/Files. Even the single-user edition models workspaces so multi-member workspaces (Phase 17+) need no schema migration.';

-- ─────────────────────────────────────────────────────────────────────────
-- workspace_members
-- Explicit membership table (rather than relying on owner_id alone) so the
-- multi-user workspace model in docs/PRODUCT_SPEC.md needs no future
-- migration — only new rows.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'member', 'viewer')),
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

comment on table public.workspace_members is
  'Explicit membership + role per workspace. The workspace owner is always also a member with role=owner (enforced by the create_workspace_with_owner function below).';

-- ─────────────────────────────────────────────────────────────────────────
-- categories
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  color text,
  icon text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name)
);

-- ─────────────────────────────────────────────────────────────────────────
-- tags
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  color text,
  created_at timestamptz not null default now(),
  unique (workspace_id, name)
);

-- ─────────────────────────────────────────────────────────────────────────
-- updated_at triggers
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_workspaces_updated_at on public.workspaces;
create trigger trg_workspaces_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- create_workspace_with_owner
-- Atomically creates a workspace and its first membership row so a workspace
-- can never exist without at least one owner-member.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.create_workspace_with_owner(p_name text, p_icon text default null, p_is_personal boolean default false)
returns public.workspaces
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace public.workspaces;
begin
  insert into public.workspaces (owner_id, name, icon, is_personal)
  values (auth.uid(), p_name, p_icon, p_is_personal)
  returning * into v_workspace;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_workspace.id, auth.uid(), 'owner');

  return v_workspace;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;

-- workspaces: visible/editable only to members; insert only via the
-- security-definer function above (direct inserts are blocked since no
-- membership row exists yet to satisfy a "must be a member" policy).
create policy "workspaces_select_member" on public.workspaces
  for select using (
    exists (
      select 1 from public.workspace_members m
      where m.workspace_id = workspaces.id and m.user_id = auth.uid()
    )
  );

create policy "workspaces_update_owner_admin" on public.workspaces
  for update using (
    exists (
      select 1 from public.workspace_members m
      where m.workspace_id = workspaces.id and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

create policy "workspaces_delete_owner" on public.workspaces
  for delete using (
    exists (
      select 1 from public.workspace_members m
      where m.workspace_id = workspaces.id and m.user_id = auth.uid()
        and m.role = 'owner'
    )
  );

-- workspace_members: members can see their fellow members; only
-- owner/admin can change roles or remove members.
create policy "workspace_members_select_member" on public.workspace_members
  for select using (
    exists (
      select 1 from public.workspace_members m
      where m.workspace_id = workspace_members.workspace_id and m.user_id = auth.uid()
    )
  );

create policy "workspace_members_manage_owner_admin" on public.workspace_members
  for all using (
    exists (
      select 1 from public.workspace_members m
      where m.workspace_id = workspace_members.workspace_id and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

-- categories / tags: any member can read; any member can write (fine-grained
-- role checks can be tightened in a later phase if needed).
create policy "categories_all_member" on public.categories
  for all using (
    exists (
      select 1 from public.workspace_members m
      where m.workspace_id = categories.workspace_id and m.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.workspace_members m
      where m.workspace_id = categories.workspace_id and m.user_id = auth.uid()
    )
  );

create policy "tags_all_member" on public.tags
  for all using (
    exists (
      select 1 from public.workspace_members m
      where m.workspace_id = tags.workspace_id and m.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.workspace_members m
      where m.workspace_id = tags.workspace_id and m.user_id = auth.uid()
    )
  );
