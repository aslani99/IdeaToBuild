# ARCHITECTURE

## لایه‌های معماری

```
Presentation      (React Components, Pages, UI state)
      ↓
Application       (Use-cases, hooks, orchestration)
      ↓
Domain            (Entities, business rules, interfaces — بدون وابستگی به فریم‌ورک)
      ↓
Repository        (پیاده‌سازی اینترفیس‌های دامنه — دسترسی به داده)
      ↓
Infrastructure    (Supabase client, R2 client, SQLite/IndexedDB, HTTP)
```

### قوانین سخت‌گیرانه

- **Presentation** هیچ کوئری دیتابیس، فراخوانی مستقیم API، یا منطق رمزنگاری ندارد.
- **Domain** هیچ import از React، Supabase SDK، یا Tauri API ندارد — کاملاً pure TypeScript.
- **Repository** فقط اینترفیس‌های تعریف‌شده در Domain را پیاده‌سازی می‌کند؛ UI فقط با اینترفیس کار می‌کند نه پیاده‌سازی مشخص.
- **Infrastructure** تنها لایه‌ای است که مستقیم با Supabase/R2/SQLite/IndexedDB صحبت می‌کند.

این جداسازی تضمین می‌کند که وقتی Phase 2 (Web) و Phase 3/4 (Mobile) شروع شود، فقط لایه‌ی Infrastructure و بخشی از Presentation عوض می‌شود — Domain و Application دست‌نخورده باقی می‌مانند.

## نقشه‌ی پوشه‌ها (src/)

```
src/
  presentation/
    components/     کامپوننت‌های قابل‌استفاده‌ی مجدد UI
    pages/          صفحات اصلی
  application/
    services/        use-case ها (مثلاً CreateIdeaService)
    hooks/            React hooks که services را به UI وصل می‌کنند
  domain/
    entities/         مدل‌های دامنه (Idea, Task, Note, File, ...)
    repositories/      اینترفیس‌های Repository (بدون پیاده‌سازی)
  repository/
    implementations/   پیاده‌سازی واقعی اینترفیس‌های Domain (با Supabase/SQLite)
  infrastructure/
    api/                کلاینت Supabase، فراخوانی‌های HTTP
    storage/            انتزاع Cloudflare R2 / فایل‌سیستم محلی
    db/                  SQLite / IndexedDB adapters
  design-system/         توکن‌های طراحی (رنگ، تایپوگرافی، فاصله‌گذاری)
  i18n/
    locales/en/          کلیدهای ترجمه‌ی انگلیسی (کاتالوگ مرجع)
    locales/fa/           ترجمه‌ی فارسی
```

## نقشه‌ی پوشه‌ی src-tauri/

```
src-tauri/
  src/main.rs              نقطه‌ی ورود Rust — فقط orchestration
  capabilities/             تعریف دقیق مجوزهای Tauri (least privilege)
  Cargo.toml
  tauri.conf.json
```

قانون: Rust فقط برای موارد زیر استفاده می‌شود — دیالوگ فایل بومی، دسترسی امن به فایل‌سیستم با scope محدود، عملیات حساس رمزنگاری/کلید. منطق دامنه در Rust تکرار نمی‌شود.

## وضعیت فعلی این سند

این نسخه‌ی اولیه (Phase 0) است. جزئیات بیشتر (مدل داده، طرح دیتابیس، الگوی همگام‌سازی) در فازهای بعدی به این سند و اسناد مرتبط (DATABASE.md، SYNC.md، ...) اضافه خواهد شد.
