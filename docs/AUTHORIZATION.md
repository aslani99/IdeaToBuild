# AUTHORIZATION

## اصل بنیادی

هیچ‌وقت به `userId`، `workspaceId`، یا هر شناسه‌ی منبع ارسالی از کلاینت اعتماد نمی‌شود. تفویض اختیار همیشه سمت سرور/دیتابیس تأیید می‌شود (بخش ۲۳ سند اصلی).

## Row Level Security (RLS) — وضعیت واقعی از Phase 2 به بعد

مدل تفویض اختیار بر پایه‌ی **عضویت در Workspace** است (نه فقط `owner_id`)، طبق `supabase/migrations/0001_phase2_core_domain.sql` و `0002_phase3_ideas.sql`:

- هر جدول (`workspaces`, `categories`, `tags`, `ideas`) یک سیاست RLS دارد که با `exists (select 1 from workspace_members m where m.workspace_id = ... and m.user_id = auth.uid())` بررسی می‌کند کاربر عضو همان workspace است یا نه.
- `workspaces` را نمی‌توان مستقیماً insert کرد — باید از طریق تابع `security definer` به نام `create_workspace_with_owner` ساخته شود، تا workspace و اولین ردیف عضویت (owner) با هم و atomic ساخته شوند (وگرنه سیاست select هیچ عضویتی برای تأیید insert جدید پیدا نمی‌کرد).
- نقش‌ها (`owner`/`admin`/`member`/`viewer`) در `workspace_members` ذخیره می‌شوند؛ برخی عملیات (مثل حذف workspace) فقط برای `owner` مجازند.
- Guest mode: داده‌ی مهمان اصلاً به Supabase نمی‌رود تا زمان مهاجرت به حساب واقعی (AUTH-005، هنوز پیاده نشده).

## Service-role Key

کلید `service_role` هرگز در کد frontend/Tauri استفاده نمی‌شود. فقط در Edge Functionهایی که سمت سرور Supabase اجرا می‌شوند مجاز است.

## وضعیت این سند

به‌روز تا Phase 3. سیاست‌های دقیق هر جدول در `docs/DATABASE.md` و فایل‌های migration مربوطه قابل مشاهده‌اند.
