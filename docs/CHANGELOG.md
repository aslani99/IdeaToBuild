# CHANGELOG

## [Unreleased] — Phase 1 (in progress)

### Fixed (2026-08-25)
- `capabilities/default.json` referenced `dialog:allow-open`/`dialog:allow-save` but `tauri-plugin-dialog` was never added as a dependency or registered — this broke `npm run tauri dev` with a "Permission dialog:allow-open not found" build error. Added `@tauri-apps/plugin-dialog` to package.json, `tauri-plugin-dialog` to Cargo.toml, and registered `.plugin(tauri_plugin_dialog::init())` in `src-tauri/src/lib.rs`.
- `App.tsx` never routed to the auth pages that were built (`SignInPage`, `SignUpPage`, `GuestBanner`, `useAuth`) — it only rendered a static "Phase 0" placeholder. Wired a minimal screen state machine so guest mode, sign-in, sign-up, and sign-out are actually reachable in the running app.
- `bundle.icon` in `tauri.conf.json` was empty but `bundle.active` was `true`, so the Windows resource build failed looking for `icons/icon.ico`, which didn't exist. Generated a placeholder icon set (`icons/icon.ico`, `icon.png`, `32x32.png`, `128x128.png`, `128x128@2x.png`) and pointed `tauri.conf.json` at them — replace with real branding before shipping. Also added `[package.metadata.bundle] identifier` to `Cargo.toml` to silence the accompanying "package.metadata does not exist" warning.

### Changed (2026-08-25)
- Switched package manager from npm to pnpm (see AD-007, docs/DECISIONS.md) so repeated installs use pnpm's global cache instead of re-downloading from the registry every time. Updated `setup-project.sh`, `README.md`, `docs/PROJECT_MEMORY.md`, and `tauri.conf.json`'s `beforeDevCommand`/`beforeBuildCommand` accordingly. Delete any existing `node_modules/` and `package-lock.json` and run `pnpm install` fresh after pulling this change.

### Added
- موجودیت‌های دامنه `User`/`Session` و اینترفیس `IAuthRepository`
- پیاده‌سازی `SupabaseAuthRepository` (guest mode، signUp، signIn، signOut، بازیابی رمز، getCurrentSession)
- `AuthService` (لایه‌ی application) و هوک `useAuth`
- صفحات `SignInPage`، `SignUpPage`، کامپوننت `GuestBanner`
- کلیدهای ترجمه‌ی auth در en/fa
- مستندات `AUTHENTICATION.md` و `AUTHORIZATION.md`

### Known gaps (مستندشده، نه پنهان)
- AUTH-004 (ابطال نشست بر اساس دستگاه) پیاده‌سازی نشده
- AUTH-005 (مهاجرت داده‌ی مهمان) پیاده‌سازی نشده — وابسته به Phase 9

## [Unreleased] — Phase 0

### Added
- ساختار مستندات پروژه (`/docs`)
- Architecture Decision Records اولیه (AD-001 تا AD-006)
- Requirements Traceability Matrix اولیه
- اسکلت پروژه‌ی React + TypeScript + Vite + Tauri 2 با معماری پنج‌لایه
- اسکلت i18n (en به‌عنوان کاتالوگ مرجع، fa به‌عنوان ترجمه)
