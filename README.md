# IdeaToBuild

پلتفرم امن شخصی مدیریت ایده، دانش، برنامه‌ریزی و فایل. مستندات کامل در `/docs`.

## وضعیت

Phase 2 — دامنه‌ی هسته (Workspace/Category/Tag) پیاده‌سازی شده. Phase 1 (احراز هویت) قبلاً روی یک پروژه‌ی واقعی Supabase تست شده. این نسخه هنوز روی سیستم خودت باید با `pnpm install` نصب بشه و migration جدید باید اجرا بشه (زیر را ببین).

## پیش‌نیازها

- Node.js 20+
- pnpm — https://pnpm.io/installation
- Rust (برای Tauri) — https://www.rust-lang.org/tools/install
- Tauri CLI prerequisites برای ویندوز: https://tauri.app/start/prerequisites/

## راه‌اندازی اولیه

```bash
pnpm install
cp .env.example .env   # سپس مقادیر Supabase را پر کن
```

سپس محتوای `supabase/migrations/0001_phase2_core_domain.sql` را در Supabase Dashboard → SQL Editor پروژه‌ات اجرا کن (یا با Supabase CLI: `supabase db push`، اگر نصب است). بدون این مرحله، Workspace/Category/Tag کار نخواهند کرد چون جداولشان وجود ندارد.

```bash
pnpm tauri dev
```

## مستندات مهم

- `docs/PROJECT_MEMORY.md` — منبع حقیقت پروژه، همیشه اول این را بخوان
- `docs/ARCHITECTURE.md` — معماری لایه‌ای
- `docs/DECISIONS.md` — تصمیمات معماری (ADR)
- `docs/PRODUCT_SPEC.md` — مشخصات محصول
- `docs/SECURITY.md` — الزامات امنیتی
- `docs/ROADMAP.md` — نقشه‌ی راه فازها
- `docs/REQUIREMENTS_TRACEABILITY.md` — ماتریس ردیابی نیازمندی‌ها

## قانون ثابت پروژه

هیچ AI/LLM درون محصول تولیدی وجود ندارد (AD-005). AI فقط ابزار توسعه است.
