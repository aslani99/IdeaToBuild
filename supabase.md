---
paths:
  - "supabase/**/*.sql"
  - "supabase/**/*.ts"
  - "src/infrastructure/api/**/*.ts"
  - "src/repository/implementations/*Supabase*.ts"
  - "src/repository/implementations/*Auth*.ts"
---

# Supabase Rules

Before changing Supabase-related code:

- Read the relevant sections of `docs/DATABASE.md`.
- Read `docs/AUTHORIZATION.md` for authorization changes.
- Read `docs/SECURITY.md` for security-sensitive changes.
- Check existing migrations before creating a new migration.
- Never edit an already-applied migration; create a new migration.
- RLS is the authoritative authorization boundary.
- Never trust client-supplied user/workspace/resource IDs.
- Preserve the established `SECURITY DEFINER` helper pattern for
  workspace membership checks.
- Do not introduce inline recursive queries against `workspace_members`
  in RLS policies.
- Never expose service-role credentials to frontend code.
- Verify SQL syntax and affected policies before declaring completion.