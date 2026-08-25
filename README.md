# IdeaToBuild

پلتفرم امن شخصی مدیریت ایده، دانش، برنامه‌ریزی و فایل. مستندات کامل در `/docs`.

## وضعیت

Phase 1 — احراز هویت (guest mode، ورود/ثبت‌نام) به رابط وصل شده. این نسخه هنوز روی سیستم خودت باید با `pnpm install` نصب بشه.

## پیش‌نیازها

- Node.js 20+
- pnpm — https://pnpm.io/installation
- Rust (برای Tauri) — https://www.rust-lang.org/tools/install
- Tauri CLI prerequisites برای ویندوز: https://tauri.app/start/prerequisites/

## راه‌اندازی اولیه

```bash
pnpm install
cp .env.example .env   # سپس مقادیر Supabase را پر کن
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
