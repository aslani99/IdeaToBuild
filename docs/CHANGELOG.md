# CHANGELOG

## [Unreleased] — Phase 1 (in progress)

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
