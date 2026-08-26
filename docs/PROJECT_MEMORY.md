# PROJECT MEMORY

این فایل حافظه‌ی دائمی و منبع حقیقت پروژه است.
هر دستیار (انسان یا AI) که روی این پروژه کار می‌کند، باید ابتدا این فایل را بخواند.
این فایل با جزئیات مکالمه‌ی روزمره پر نمی‌شود — فقط تصمیمات و محدودیت‌های دائمی.

## هویت پروژه

- نام: IdeaToBuild
- ریپازیتوری: https://github.com/aslani99/IdeaToBuild
- نوع: پلتفرم شخصی مدیریت ایده، دانش، برنامه‌ریزی و فایل (Idea/PKM Platform)
- وضعیت فعلی: Phase 2 — دامنه‌ی هسته (Workspace/Category/Tag) پیاده‌سازی شده؛ نیاز به اجرای migration و تست دستی روی پروژه‌ی واقعی Supabase

## محدودیت‌های دائمی (غیرقابل‌تغییر بدون تأیید صریح مالک پروژه)

1. **بدون AI در محصول نهایی.** هیچ LLM، چت‌بات، جستجوی هوشمند، یا پردازش AI درون اپلیکیشن تولیدی وجود نخواهد داشت. AI فقط به‌عنوان ابزار توسعه (در طول ساخت پروژه) مجاز است.
2. **بدون پیاده‌سازی جعلی (Fake Implementation).** احراز هویت، رمزنگاری، همگام‌سازی، بک‌آپ و ذخیره‌سازی هرگز نباید به‌صورت ساختگی/موقتی برای دمو پیاده‌سازی شوند.
3. **بدون بازنویسی کورکورانه.** پیش از تغییر هر فایل موجود، باید بررسی شود که چه چیزی به آن وابسته است.
4. معماری باید از روز اول چندسکویی (cross-platform) باشد، حتی اگر دسکتاپ اولین هدف تولیدی است.

## تصمیمات فناوری (خلاصه — جزئیات در DECISIONS.md)

- Frontend: React + TypeScript + Vite
- Desktop: Tauri 2 (Rust فقط برای یکپارچگی با سیستم‌عامل)
- Backend: Supabase (PostgreSQL + Auth + RLS + Realtime + Edge Functions)
- Object Storage: Cloudflare R2 (متادیتای فایل در Postgres، خود فایل در R2)
- دیتابیس محلی: SQLite (دسکتاپ/موبایل)، IndexedDB (وب)
- معماری لایه‌ای: Presentation → Application → Domain → Repository → Infrastructure

## ترتیب فازهای توسعه

Phase 0 (بنیاد) → Phase 1 (Windows Desktop) → Phase 2 (Web) → Phase 3 (Android) → Phase 4 (iOS)

## وضعیت فعلی (آخرین به‌روزرسانی: 2026-08-25)

- ریپازیتوری در گیت‌هاب ساخته شده: aslani99/IdeaToBuild
- Phase 0 (بنیاد معماری/مستندات/اسکلت پروژه) کامل شده
- Phase 1 (احراز هویت) پیاده‌سازی و **تست شده روی یک پروژه‌ی واقعی Supabase**: Guest mode، sign up/in با Supabase Auth، بازیابی رمز پیاده‌سازی شده؛ `App.tsx` به این صفحات وصل (route) شده و برنامه با `pnpm tauri dev` روی ویندوز اجرا می‌شود.
- Phase 2 (دامنه‌ی هسته: Workspace، عضویت، Category، Tag) پیاده‌سازی شد ولی **هنوز روی هیچ پروژه‌ی واقعی Supabase تست نشده**:
  - migration جدید: `supabase/migrations/0001_phase2_core_domain.sql` — جداول `workspaces`, `workspace_members`, `categories`, `tags`، تابع `create_workspace_with_owner`، و RLS کامل. **این migration باید دستی روی پروژه‌ی Supabase کاربر اجرا شود** (SQL editor یا CLI) — هنوز اجرا نشده است.
  - کد کامل پنج‌لایه (entity → repository interface → Supabase implementation → application service → hook) برای هر سه موجودیت نوشته شد؛ `DashboardPage` به `App.tsx` وصل شد (فقط برای کاربر authenticated — چون RLS به `auth.uid()` وابسته است و guest چنین چیزی ندارد).
  - `npx tsc --noEmit` و `npx vite build` هر دو بدون خطا پاس شدند؛ ولی run واقعی `pnpm tauri dev` + تست دستی (ساخت workspace/category/tag از UI) هنوز روی سیستم کاربر انجام نشده.
  - در ضمن یک باگ preexisting از Phase 1 پیدا و رفع شد: `src/vite-env.d.ts` وجود نداشت، پس `import.meta.env.VITE_SUPABASE_URL`/`ANON_KEY` تایپ‌دار نبودند.
- پکیج‌منیجر از npm به pnpm تغییر کرد (AD-007) — همه‌ی مستندات و اسکریپت‌ها به‌روز شدند.
- باگ‌های رفع‌شده حین راه‌اندازی اولیه‌ی Phase 1 (جزئیات کامل در CHANGELOG.md):
  - `tauri-plugin-dialog` استفاده می‌شد ولی نصب/register نشده بود → اضافه شد.
  - آیکون‌های ویندوز (`icons/icon.ico` و بقیه) وجود نداشتند ولی `bundle.active: true` بود → آیکون placeholder ساخته و در `tauri.conf.json` رجیستر شد؛ **باید قبل از انتشار با آیکون واقعی جایگزین شود**.
  - `App.tsx` هیچ‌وقت به `SignInPage`/`SignUpPage`/`GuestBanner`/`useAuth` که ساخته شده بودند وصل نشده بود → یک state machine ساده (`guest-banner` / `sign-in` / `sign-up` / `dashboard`) اضافه شد.
- ناتمام و به‌صراحت مستندشده (هنوز پیاده‌سازی واقعی ندارند): AUTH-004 (ابطال نشست بر اساس دستگاه)، AUTH-005 (مهاجرت داده‌ی مهمان — وابسته به لایه‌ی SQLite/IndexedDB در Phase 9)، IDEA-001 (موجودیت Idea کامل — Phase 3؛ `Idea.ts`/`IIdeaRepository.ts`/`SupabaseIdeaRepository.ts` اسکلت از پیش وجود دارند و صادقانه `throw new Error("Not implemented yet")` می‌زنند — این تناقض نیست، بلکه اسکلت آگاهانه‌ی زودهنگام است)
- گام بعدی:
  1. کاربر باید migration جدید `0003_phase3_entry_date.sql` را هم روی پروژه‌ی Supabase خودش اجرا کند (0001 و 0002 قبلاً با موفقیت اجرا و تأیید شدند — همه‌ی ۵ جدول موجودند).
  2. تست دستی UI (`pnpm tauri dev` → ساخت/جابه‌جایی Workspace، ساخت Category/Tag، ساخت/حذف/جابه‌جایی/کپی Idea با تقویم بالای صفحه).
  3. سپس ادامه‌ی Phase 3: محتوای غنی (rich content editor)، زیروظیفه، نقطه‌عطف، پیوست فایل، نماهای متعدد (Board/Calendar/Gantt/Graph)، و یک widget واقعی تقویم شمسی/قمری (فعلاً فقط input بومی + برچسب) — همه‌ی این‌ها هنوز باقی مانده‌اند.

## این نشست چه‌کاری انجام داد (Phase 3.5 — ناوبری تاریخ‌محور، AD-009)

- تأیید شد: کاربر هر دو migration قبلی (`0001`, `0002`) را روی Supabase واقعی اجرا کرد؛ هر ۵ جدول (`workspaces`, `workspace_members`, `categories`, `tags`, `ideas`) موجودند.
- به درخواست مالک پروژه، یک قابلیت اساسی جدید طراحی و پیاده شد: کل اپ حول یک «تاریخ فعال» می‌چرخد (شمسی/میلادی/قمری قابل‌انتخاب)؛ هر Idea یک `entryDate` دارد که مستقیم قابل ویرایش نیست — فقط move (جابه‌جایی رکورد) یا copy (کپی به تاریخ دیگر). جزئیات کامل در AD-009 (`docs/DECISIONS.md`) و CAL-001 (`docs/REQUIREMENTS_TRACEABILITY.md`).
- migration جدید: `supabase/migrations/0003_phase3_entry_date.sql` — **هنوز اجرا نشده روی Supabase واقعی**.
- کد: `ActiveDateContext`/`useActiveDate` (state سراسری تاریخ)، `DateNavigator` (کنترل تقویم بالای اپ)، `src/i18n/calendarFormat.ts` (تبدیل نمایش با Intl، نه تبدیل واقعی داده)، به‌روزرسانی `useIdeas`/`IdeasPanel`/`IdeaService`/`SupabaseIdeaRepository`/`IIdeaRepository`.
- ناتمام و مستندشده: widget واقعی شبکه‌ی تقویم شمسی/قمری (فعلاً input بومی + برچسب)، ذخیره‌ی دائمی ترجیح تقویم کاربر، تعمیم این الگو به Notes/Files در فازهای بعدی.

## این نشست چه‌کاری انجام داد (Phase 3 — مدیریت ایده، فیلدهای هسته)

- `SupabaseIdeaRepository.ts` از placeholder به پیاده‌سازی واقعی تبدیل شد (CRUD کامل + soft delete).
- `IdeaService` گسترش یافت (`updateIdea`, `deleteIdea`)، `useIdeas` hook و `IdeasPanel` UI ساخته و به `DashboardPage`/`App.tsx` وصل شدند.
- migration جدید: `supabase/migrations/0002_phase3_ideas.sql` (جدول `ideas` + RLS مبتنی بر عضویت workspace، همون الگوی فاز ۲) — **هنوز اجرا نشده روی Supabase واقعی**.
- `docs/DATABASE.md` که قبلاً ساخته شده بود ولی در نسخه‌ی فعلی ریپازیتوری وجود نداشت، دوباره ساخته شد (شامل هر دو migration).
- `docs/AUTHORIZATION.md` به‌روزرسانی شد تا مدل واقعی RLS (مبتنی بر عضویت، نه فقط owner) رو منعکس کنه.
- ناتمام و مستندشده: optimistic concurrency واقعی روی `version` (فعلاً فقط افزایش می‌یابد)، محتوای غنی/زیروظیفه/نقطه‌عطف/فایل/نماهای متعدد.

## نکات مهم برای هر دستیار آینده

- قبل از هر تغییر مهم، این فایل و ARCHITECTURE.md و DECISIONS.md را بخوان.
- هرگز قابلیت موجود را بدون بررسی وابستگی‌هایش حذف نکن.
- هر تصمیم معماری مهم جدید باید به‌عنوان یک ADR جدید در DECISIONS.md ثبت شود.

## دستورالعمل شروع کار برای هر AI جدید (چک‌لیست اجباری)

اگر این پروژه را در یک ابزار/مدل AI دیگر باز کرده‌ای، قبل از هر پاسخ یا تغییر کد، این ترتیب را دنبال کن:

1. این فایل (`PROJECT_MEMORY.md`) را کامل بخوان — وضعیت واقعی پروژه اینجاست، نه در حافظه‌ی خودت.
2. `docs/CHANGELOG.md` را بخوان تا آخرین رفع‌باگ‌ها و تغییرات را ببینی (خصوصاً بخش‌های اخیر).
3. `docs/DECISIONS.md` را بخوان تا هیچ تصمیم قبلی (مثلاً AD-005: بدون AI در محصول، AD-007: pnpm) را نقض نکنی.
4. `docs/REQUIREMENTS_TRACEABILITY.md` را با کد واقعی داخل `src/` مقایسه کن — این دو ممکن است همگام نباشند (نمونه: `SupabaseIdeaRepository.ts` از قبل نوشته شده ولی traceability matrix آن را "برنامه‌ریزی‌شده" نشان می‌دهد). اگر ناهماهنگی دیدی، اول آن را گزارش بده، حدس نزن.
5. package manager پروژه **pnpm** است، نه npm (`pnpm install`, `pnpm tauri dev`) — هرگز دستورات npm پیشنهاد نده مگر کاربر صراحتاً بخواهد.
6. هر تغییری که دادی (رفع باگ، فیچر جدید، تصمیم فنی) را در همان نشست به `docs/CHANGELOG.md` اضافه کن؛ اگر تصمیم معماری بود، یک ADR جدید هم در `docs/DECISIONS.md` بنویس. این فایل‌ها فقط زمانی «حافظه‌ی زنده» می‌مانند که هر دستیار آن‌ها را به‌روز نگه دارد — به‌روزرسانی این مستندات بخشی جدایی‌ناپذیر از هر کار است، نه یک قدم اختیاری در پایان.
