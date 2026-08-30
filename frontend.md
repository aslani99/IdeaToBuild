---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "src/**/*.css"
---

# Frontend Rules

- Preserve the five-layer architecture.
- Keep business logic out of presentation components.
- Use Application services/hooks for orchestration.
- Keep Domain framework-independent.
- Use Repository interfaces rather than concrete infrastructure
  implementations from presentation code.
- Preserve the existing i18n architecture.
- Reuse existing design-system primitives before creating new ones.
- Avoid unrelated UI refactors.
- Do not hard-code user-facing strings when translation keys are required.
- Run `pnpm build` after significant TypeScript/React changes.