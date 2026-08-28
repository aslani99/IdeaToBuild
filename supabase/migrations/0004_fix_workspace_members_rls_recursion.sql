-- Fix: "infinite recursion detected in policy for relation workspace_members"
-- (Postgres error 42P17). Root cause: the RLS policies on workspace_members
-- checked membership by querying workspace_members itself inside an EXISTS
-- subquery — evaluating that subquery re-triggers RLS on workspace_members,
-- which re-runs the same policy, forever.
--
-- Fix: a SECURITY DEFINER function bypasses RLS internally, so it can query
-- workspace_members without re-triggering its policies. Every policy that
-- needs to check "is this user a member of this workspace" now calls this
-- function instead of writing its own EXISTS subquery against
-- workspace_members directly.

create or replace function public.is_workspace_member(p_workspace_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace_id and user_id = p_user_id
  );
$$;

create or replace function public.is_workspace_owner_or_admin(p_workspace_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace_id and user_id = p_user_id and role in ('owner', 'admin')
  );
$$;

create or replace function public.is_workspace_owner(p_workspace_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace_id and user_id = p_user_id and role = 'owner'
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- workspace_members — the actual source of the recursion
-- ─────────────────────────────────────────────────────────────────────────
drop policy if exists "workspace_members_select_member" on public.workspace_members;
create policy "workspace_members_select_member" on public.workspace_members
  for select using (public.is_workspace_member(workspace_id, auth.uid()));

drop policy if exists "workspace_members_manage_owner_admin" on public.workspace_members;
create policy "workspace_members_manage_owner_admin" on public.workspace_members
  for all using (public.is_workspace_owner_or_admin(workspace_id, auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────
-- workspaces — rewritten to use the same helper functions instead of an
-- inline subquery on workspace_members (not strictly required to fix the
-- recursion, since workspace_members' own policies are fixed now, but kept
-- consistent and avoids an extra nested policy evaluation).
-- ─────────────────────────────────────────────────────────────────────────
drop policy if exists "workspaces_select_member" on public.workspaces;
create policy "workspaces_select_member" on public.workspaces
  for select using (public.is_workspace_member(id, auth.uid()));

drop policy if exists "workspaces_update_owner_admin" on public.workspaces;
create policy "workspaces_update_owner_admin" on public.workspaces
  for update using (public.is_workspace_owner_or_admin(id, auth.uid()));

drop policy if exists "workspaces_delete_owner" on public.workspaces;
create policy "workspaces_delete_owner" on public.workspaces
  for delete using (public.is_workspace_owner(id, auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────
-- categories / tags / ideas — same cleanup
-- ─────────────────────────────────────────────────────────────────────────
drop policy if exists "categories_all_member" on public.categories;
create policy "categories_all_member" on public.categories
  for all using (public.is_workspace_member(workspace_id, auth.uid()))
  with check (public.is_workspace_member(workspace_id, auth.uid()));

drop policy if exists "tags_all_member" on public.tags;
create policy "tags_all_member" on public.tags
  for all using (public.is_workspace_member(workspace_id, auth.uid()))
  with check (public.is_workspace_member(workspace_id, auth.uid()));

drop policy if exists "ideas_all_member" on public.ideas;
create policy "ideas_all_member" on public.ideas
  for all using (public.is_workspace_member(workspace_id, auth.uid()))
  with check (public.is_workspace_member(workspace_id, auth.uid()));
