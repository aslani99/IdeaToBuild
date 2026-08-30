---
paths:
  - "src-tauri/**/*"
---

# Tauri / Rust Rules

Before changing Rust/Tauri code:

- Read the relevant section of `docs/ARCHITECTURE.md`.
- Check `docs/SECURITY.md`.
- Check relevant ADRs in `docs/DECISIONS.md`.
- Preserve least-privilege Tauri capabilities.
- Do not add unrestricted shell or filesystem access.
- Keep OS-specific functionality inside the Tauri/infrastructure boundary.
- Preserve the local-first storage architecture.
- Treat encryption and credential-manager integration as security-sensitive.
- Do not claim Rust changes are verified until `pnpm tauri dev` or an
  appropriate Rust/Tauri build has actually run successfully.