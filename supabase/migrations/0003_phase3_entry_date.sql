-- Phase 3.5 — Date-driven navigation ("Entry Date" / calendar-as-home,
-- see docs/DECISIONS.md AD-009 and docs/PRODUCT_SPEC.md CAL-001).
-- Depends on 0002_phase3_ideas.sql.

-- entry_date is a plain DATE (no time/timezone) — it represents which
-- calendar day a record belongs to in the app's navigation model, distinct
-- from created_at/updated_at which are real timestamps.
alter table public.ideas
  add column if not exists entry_date date not null default current_date;

create index if not exists ideas_workspace_entry_date_idx
  on public.ideas (workspace_id, entry_date)
  where deleted_at is null;

comment on column public.ideas.entry_date is
  'The calendar day this idea belongs to in the date-driven navigation model (AD-009). Not edited in place — see move_idea_to_date / copy the record for a new entry_date instead.';

-- ─────────────────────────────────────────────────────────────────────────
-- move_idea_to_date — the only sanctioned way to change entry_date directly
-- (kept as an RPC so future audit-logging/history hooks have one place to
-- attach to, rather than a bare client-side `update`).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.move_idea_to_date(p_idea_id uuid, p_new_entry_date date)
returns public.ideas
language plpgsql
security invoker
as $$
declare
  v_idea public.ideas;
begin
  update public.ideas
  set entry_date = p_new_entry_date
  where id = p_idea_id
  returning * into v_idea;

  if v_idea.id is null then
    raise exception 'Idea % not found or not permitted', p_idea_id;
  end if;

  return v_idea;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- copy_idea_to_date — duplicates a row under a new entry_date; the
-- original row and its id are untouched.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.copy_idea_to_date(p_idea_id uuid, p_new_entry_date date)
returns public.ideas
language plpgsql
security invoker
as $$
declare
  v_source public.ideas;
  v_copy public.ideas;
begin
  select * into v_source from public.ideas where id = p_idea_id;

  if v_source.id is null then
    raise exception 'Idea % not found or not permitted', p_idea_id;
  end if;

  insert into public.ideas (
    workspace_id, owner_id, title, description, icon, cover_image_url,
    status, priority, category_id, tag_ids, deadline, entry_date
  )
  values (
    v_source.workspace_id, v_source.owner_id, v_source.title, v_source.description,
    v_source.icon, v_source.cover_image_url, v_source.status, v_source.priority,
    v_source.category_id, v_source.tag_ids, v_source.deadline, p_new_entry_date
  )
  returning * into v_copy;

  return v_copy;
end;
$$;

-- Both RPCs run with security invoker (not definer) — they rely on the
-- caller's own RLS permissions on `ideas` (the existing "ideas_all_member"
-- policy already covers select/insert/update), so no privilege escalation
-- is introduced here.
