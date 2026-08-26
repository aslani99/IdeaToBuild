# CHANGELOG

## [Unreleased] — Phase 3.5 (date-driven navigation, AD-009)

### Added (2026-08-26, later)
- `Idea.entryDate` field (plain date, no time) — the day a record belongs to in the new calendar-driven navigation model. Distinct from `createdAt`/`updatedAt`.
- Migration `supabase/migrations/0003_phase3_entry_date.sql`: `ideas.entry_date` column + index, and two RPCs (`move_idea_to_date`, `copy_idea_to_date`) as the only sanctioned ways to change which day a record belongs to. **Not yet run against a live Supabase project.**
- `ActiveDateContext`/`useActiveDate` — the app-wide "what day are we looking at" state, defaulting to today, wrapping the whole app in `App.tsx`.
- `DateNavigator` component: native date picker + a calendar-system selector (Gregorian/Jalali/Hijri) that only changes the *displayed* label (`src/i18n/calendarFormat.ts`, via `Intl.DateTimeFormat` calendar extension) — the stored date and all queries stay plain Gregorian ISO.
- `useIdeas` now fetches by `(workspaceId, activeDate)` instead of the whole workspace; new `moveIdea`/`copyIdea` actions.
- `IdeasPanel` gained per-idea Move/Copy buttons with an inline date picker.
- `IIdeaRepository.update()` signature now explicitly excludes `entryDate` — moving/copying is a separate, deliberate action, never a silent side effect of a general update.
- Translation keys: `idea.move`/`idea.copy`/`idea.confirm`/`idea.cancel`, and a new `calendar.*` namespace, in en/fa.
- `docs/DECISIONS.md` AD-009, `docs/PRODUCT_SPEC.md` CAL-001 section, `docs/DATABASE.md` entry_date/RPC docs.

### Known gaps (مستندشده، نه پنهان)
- migration 0003 هنوز اجرا نشده.
- انتخابگر تقویم فقط از `<input type="date">` بومی (همیشه میلادی در UI) استفاده می‌کند؛ یک widget واقعی شبکه‌ی تقویم شمسی/قمری هنوز ساخته نشده — تصمیم آگاهانه‌ی MVP (AD-009).
- ترجیح تقویم نمایشی (شمسی/میلادی/قمری) در state موقت React نگه داشته می‌شود، نه در تنظیمات دائمی کاربر.
- این مدل فقط روی Ideas پیاده شده؛ Notes/Files (وقتی ساخته بشن) باید همین الگو رو تکرار کنن، نه یک الگوی جدا.

## [Unreleased] — Phase 3 (in progress)

### Added (2026-08-26)
- SQL migration `supabase/migrations/0002_phase3_ideas.sql`: جدول `ideas` (فیلدهای هسته: title/description/icon/cover/status/priority/category/tag_ids/deadline/version/deleted_at)، ایندکس روی `workspace_id`، trigger برای `updated_at`، و RLS مبتنی بر عضویت workspace (همون الگوی migration فاز ۲). **هنوز روی هیچ پروژه‌ی واقعی Supabase اجرا نشده.**
- `SupabaseIdeaRepository.ts` از placeholder به پیاده‌سازی واقعی تبدیل شد: `getById`، `listByWorkspace`، `create`، `update` (فیلدهای partial)، `softDelete` (با `deleted_at`، نه حذف واقعی — طبق قانون «هرگز حذف ناگهانی داده»).
- `IdeaService` گسترش یافت: `updateIdea`، `deleteIdea`، و validation ساده (عنوان خالی رد می‌شود).
- هوک `useIdeas` (مشابه الگوی `useWorkspace`/`useAuth`) که به workspace فعال وابسته است.
- کامپوننت `IdeasPanel` (لیست/ساخت/حذف ایده) و اتصالش به `DashboardPage.tsx` (که حالا `ownerId` را از `App.tsx` می‌گیرد).
- کلیدهای ترجمه‌ی `idea.namePlaceholder`/`idea.noIdeas`/`idea.myIdeas`/`idea.delete` در en/fa.

### Known gaps (مستندشده، نه پنهان)
- migration هنوز اجرا نشده — تا اجرا نشه، بخش ایده‌ها با خطای دیتابیس مواجه میشه.
- optimistic concurrency واقعی روی ستون `version` پیاده نشده (فعلاً فقط افزایش می‌یابد، مقایسه‌ی نسخه در آپدیت چک نمی‌شود) — قبل از تکیه‌کردن روی آن برای تشخیص تعارض (Phase 10)، باید یک RPC اتمیک نوشته شود.
- محتوای غنی (headings/lists/checklists/...)، زیروظیفه، نقطه‌عطف، پیوست فایل، لینک تقویم، و نماهای متعدد (List/Table/Board/Calendar/Timeline/Gantt/Graph/Statistics) طبق docs/PRODUCT_SPEC.md هنوز پیاده نشده‌اند — این تکرار همون MVP-first تصمیمیه که در فاز ۲ هم گرفته شد، نه فراموشی.

## [Unreleased] — Phase 2 (in progress)

### Added (2026-08-25)
- SQL migration `supabase/migrations/0001_phase2_core_domain.sql`: tables `workspaces`, `workspace_members`, `categories`, `tags`, the `create_workspace_with_owner` security-definer RPC (so a workspace can never exist without an owner-member row), `updated_at` triggers, and full Row Level Security policies scoped to workspace membership (see docs/SECURITY.md, "تفویض اختیار"). **This migration has not yet been run against a live Supabase project — run it via the Supabase SQL editor or CLI before testing Phase 2 features.**
- Domain entities: `Workspace`/`WorkspaceMember` (with explicit `role`), `Category`, `Tag` — all pure TypeScript per docs/ARCHITECTURE.md.
- Domain repository interfaces: `IWorkspaceRepository`, `ICategoryRepository`, `ITagRepository`.
- Supabase implementations: `SupabaseWorkspaceRepository`, `SupabaseCategoryRepository`, `SupabaseTagRepository` — real queries (not placeholders), relying on RLS rather than client-side membership checks.
- Application services: `WorkspaceService` (incl. `ensureDefaultWorkspace`), `CategoryService`, `TagService`.
- `useWorkspace` hook (mirrors the `useAuth` pattern) wiring services into React state.
- `DashboardPage`: minimal UI to list/create workspaces and manage categories/tags within the active one — wired into `App.tsx` for authenticated users only (workspaces require `auth.uid()` via RLS, so guests still see the Phase 1 guest banner instead, pending AUTH-005 guest-data migration in Phase 9).
- `workspace.*` translation keys in `src/i18n/locales/{en,fa}/common.json`.
- `src/vite-env.d.ts` (`/// <reference types="vite/client" />`) — was missing since Phase 1, which made `import.meta.env.VITE_SUPABASE_URL`/`ANON_KEY` untyped under `tsc --noEmit`.

### Fixed (2026-08-25)
- `SupabaseIdeaRepository` (Phase 3 placeholder) failed `tsc --noEmit` under `noUnusedLocals` because its `client` field was assigned but never read. Moved the `getSupabaseClient()` call into the constructor (still validates env vars eagerly, matches the other repositories) without storing an unused field, until real Phase 3 queries are added.

### Fixed (2026-08-25, earlier)
- `capabilities/default.json` referenced `dialog:allow-open`/`dialog:allow-save` but `tauri-plugin-dialog` was never added as a dependency or registered — this broke `npm run tauri dev` with a "Permission dialog:allow-open not found" build error. Added `@tauri-apps/plugin-dialog` to package.json, `tauri-plugin-dialog` to Cargo.toml, and registered `.plugin(tauri_plugin_dialog::init())` in `src-tauri/src/lib.rs`.
- `App.tsx` never routed to the auth pages that were built (`SignInPage`, `SignUpPage`, `GuestBanner`, `useAuth`) — it only rendered a static "Phase 0" placeholder. Wired a minimal screen state machine so guest mode, sign-in, sign-up, and sign-out are actually reachable in the running app.
- `bundle.icon` in `tauri.conf.json` was empty but `bundle.active` was `true`, so the Windows resource build failed looking for `icons/icon.ico`, which didn't exist. Generated a placeholder icon set (`icons/icon.ico`, `icon.png`, `32x32.png`, `128x128.png`, `128x128@2x.png`) and pointed `tauri.conf.json` at them — replace with real branding before shipping. Also added `[package.metadata.bundle] identifier` to `Cargo.toml` to silence the accompanying "package.metadata does not exist" warning.

### Changed (2026-08-25)
- Switched package manager from npm to pnpm (see AD-007, docs/DECISIONS.md) so repeated installs use pnpm's global cache instead of re-downloading from the registry every time. Updated `setup-project.sh`, `README.md`, `docs/PROJECT_MEMORY.md`, and `tauri.conf.json`'s `beforeDevCommand`/`beforeBuildCommand` accordingly. Delete any existing `node_modules/` and `package-lock.json` and run `pnpm install` fresh after pulling this change.

### Added — Phase 1
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
