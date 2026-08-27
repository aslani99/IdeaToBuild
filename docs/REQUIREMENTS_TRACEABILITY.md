# REQUIREMENTS TRACEABILITY MATRIX

هر نیازمندی مهم یک شناسه‌ی دائمی دارد. یک ویژگی تا زمانی که در این جدول ردیابی نشود، «کامل» تلقی نمی‌شود.

| ID | توضیح | اولویت | وضعیت | محل پیاده‌سازی | محل تست | تأیید شده؟ |
|---|---|---|---|---|---|---|
| AD-001..006 | تصمیمات معماری پایه | بالا | ثبت‌شده | docs/DECISIONS.md | — | بله (سندی) |
| SEC-001 | بدون AI درون محصول تولیدی | بحرانی | فعال | — (قانون معماری) | code review | در حال پایش |
| AUTH-001 | Guest mode بدون اجبار ورود؛ ذخیره‌سازی فقط با requireAuth() گیت می‌شود | بالا | پیاده‌سازی شد: مهمان کل داشبورد رو می‌بینه، `requireAuth()` قبل از هر create/save کادر ورود رو باز می‌کنه | src/application/context/AuthContext.tsx, src/presentation/components/AuthRequiredModal.tsx, src/presentation/pages/DashboardPage.tsx | — | خیر (تست دستی لازم) |
| AUTH-003b | Session persistence — کاربر بعد از ثبت‌نام نیازی به ورود دوباره ندارد | بالا | پیاده‌سازی شد: `restoreSession()` روی mount چک می‌کنه | src/application/context/AuthContext.tsx, src/repository/implementations/SupabaseAuthRepository.ts | — | خیر (تست دستی لازم) |
| SYNC-001 | ذخیره‌سازی محلی رمزنگاری‌شده + همگام‌سازی خودکار پس‌زمینه (فعلاً فقط Idea) | بحرانی | پیاده‌سازی شد (AD-010) — منتظر build/تست واقعی Rust | src-tauri/src/local_store.rs, src/repository/implementations/LocalFirstIdeaRepository.ts, src/application/services/SyncEngine.ts | — | خیر (نیاز به build واقعی و تست دستی؛ کد Rust در این نشست کامپایل نشده) |
| AUTH-002 | ایمیل/رمز عبور + تأیید ایمیل + بازیابی | بالا | اسکلت پیاده‌سازی شد | src/repository/implementations/SupabaseAuthRepository.ts, src/presentation/pages/SignInPage.tsx, SignUpPage.tsx | — | خیر (نیاز به پروژه‌ی واقعی Supabase برای تست) |
| AUTH-003 | مدیریت نشست | بالا | اسکلت پیاده‌سازی شد | SupabaseAuthRepository.getCurrentSession | — | خیر |
| AUTH-004 | ابطال نشست بر اساس دستگاه | متوسط | برنامه‌ریزی‌شده (نیاز به جدول user_sessions + Edge Function) | — | — | خیر |
| AUTH-005 | مهاجرت داده‌ی مهمان به حساب | بالا | اینترفیس تعریف شد، پیاده‌سازی وابسته به Phase 9 (SQLite/IndexedDB) | src/application/services/AuthService.ts | — | خیر |
| ARCH-001 | معماری پنج‌لایه (Presentation→...→Infrastructure) | بحرانی | اسکلت ساخته‌شد | src/ | — | در حال پایش |
| I18N-001 | کاتالوگ ترجمه‌ی کانونی (en مرجع) | بالا | اسکلت اولیه | src/i18n/ | — | خیر |
| RTL-001 | تشخیص جهت از متادیتای locale | بالا | برنامه‌ریزی‌شده | src/i18n/ | — | خیر |
| WS-001 | موجودیت Workspace + عضویت (owner/admin/member/viewer) | بحرانی | پیاده‌سازی شد (RLS) | supabase/migrations/0001_phase2_core_domain.sql, src/domain/entities/Workspace.ts, src/repository/implementations/SupabaseWorkspaceRepository.ts, src/application/services/WorkspaceService.ts, src/application/hooks/useWorkspace.ts, src/presentation/pages/DashboardPage.tsx | — | خیر (نیاز به تست دستی روی پروژه‌ی واقعی Supabase پس از اجرای migration) |
| WS-002 | Category در سطح Workspace | بالا | پیاده‌سازی شد (RLS) | supabase/migrations/0001_phase2_core_domain.sql, src/domain/entities/Category.ts, src/repository/implementations/SupabaseCategoryRepository.ts, src/application/services/CategoryService.ts | — | خیر (نیاز به تست دستی) |
| WS-003 | Tag در سطح Workspace | بالا | پیاده‌سازی شد (RLS) | supabase/migrations/0001_phase2_core_domain.sql, src/domain/entities/Tag.ts, src/repository/implementations/SupabaseTagRepository.ts, src/application/services/TagService.ts | — | خیر (نیاز به تست دستی) |
| IDEA-001 | موجودیت Idea با فیلدهای کامل (فاز اول: عنوان/توضیح/وضعیت/اولویت/دسته/برچسب/ددلاین) | بحرانی | پیاده‌سازی شد (منتظر اجرای migration و تست دستی) — رفع‌شده در همین نشست: `SupabaseIdeaRepository.ts` دیگه placeholder نیست، کوئری واقعی داره | src/repository/implementations/SupabaseIdeaRepository.ts, src/application/hooks/useIdeas.ts, src/presentation/components/IdeasPanel.tsx, supabase/migrations/0002_phase3_ideas.sql | — | خیر (نیاز به اجرای migration و تست UI واقعی) |
| CAL-001 | ناوبری تاریخ‌محور: هر رکورد به یک entry_date تعلق دارد؛ تقویم سراسری (شمسی/میلادی/قمری) تعیین‌کننده‌ی چیزی است که کاربر می‌بیند؛ move/copy بین تاریخ‌ها (AD-009) | بحرانی | پیاده‌سازی شد (منتظر اجرای migration و تست دستی) | src/domain/entities/Idea.ts, src/application/context/ActiveDateContext.tsx, src/presentation/components/DateNavigator.tsx, src/i18n/calendarFormat.ts, supabase/migrations/0003_phase3_entry_date.sql | — | خیر (نیاز به اجرای migration و تست UI واقعی) |
| FILE-001 | مدیریت فایل امن با R2 | بحرانی | برنامه‌ریزی‌شده (Phase 7-8) | — | — | خیر |
| SYNC-001 | لایه‌ی همگام‌سازی با تشخیص تعارض | بحرانی | برنامه‌ریزی‌شده (Phase 10) | — | — | خیر |
| BACKUP-001 | بک‌آپ رمزنگاری‌شده و تست‌شده | بالا | برنامه‌ریزی‌شده (Phase 45) | — | — | خیر |

> این جدول در هر فاز به‌روزرسانی می‌شود؛ نیازمندی‌های جدید با شناسه‌ی جدید اضافه می‌شوند.
