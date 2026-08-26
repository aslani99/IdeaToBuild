# DATABASE

طرح دیتابیس با migration نسخه‌دار (`supabase/migrations/`) مدیریت می‌شود — هرگز تغییر دستی روی schema تولیدی.

## جدول‌های Phase 2 (`0001_phase2_core_domain.sql`)

### `workspaces`
| ستون | نوع | توضیح |
|---|---|---|
| id | uuid | کلید اصلی |
| owner_id | uuid | ارجاع به `auth.users` |
| name | text | نام Workspace، نمی‌تونه خالی باشه |
| icon | text/null | |
| is_personal | boolean | |
| created_at / updated_at | timestamptz | `updated_at` با trigger خودکار به‌روز می‌شه |

### `workspace_members`
مدل عضویت صریح (نه فقط `owner_id`) تا Workspace چندنفره در آینده نیاز به migration نداشته باشه. نقش‌ها: `owner`/`admin`/`member`/`viewer`.

### `categories` و `tags`
هر دو به `workspace_id` وابسته‌اند، با `unique(workspace_id, name)`. `categories` تک‌انتخابی، `tags` چندانتخابی.

### تابع `create_workspace_with_owner`
یک تابع `security definer` که Workspace و اولین ردیف عضویت (owner) رو با هم، به‌صورت atomic می‌سازه — چون insert مستقیم به `workspaces` بدون این تابع با RLS مواجه می‌شه (عضویتی هنوز وجود نداره که سیاست select رو satisfy کنه).

## جدول Phase 3 (`0002_phase3_ideas.sql`)

### `ideas`
| ستون | نوع | توضیح |
|---|---|---|
| id | uuid | کلید اصلی |
| workspace_id | uuid | ارجاع به `workspaces` |
| owner_id | uuid | ارجاع به `auth.users` |
| title | text | اجباری، غیرخالی |
| description, icon, cover_image_url | text/null | اختیاری |
| status | text | یکی از draft/active/in_progress/on_hold/completed/archived |
| priority | text | یکی از low/medium/high/urgent |
| category_id | uuid/null | ارجاع به `categories` |
| tag_ids | uuid[] | آرایه‌ای از `tags.id` (فعلاً بدون foreign key سطح آرایه — محدودیت شناخته‌شده) |
| deadline | timestamptz/null | |
| version | integer | برای Phase 10 (sync/conflict detection) — فعلاً فقط افزایش می‌یابد، مقایسه نمی‌شود |
| deleted_at | timestamptz/null | soft delete (Phase 11 — Trash) |

**محدودیت شناخته‌شده:** `tag_ids` آرایه‌ی ساده است، نه جدول join؛ حذف یک tag خودکار از `tag_ids` ایده‌ها پاک نمی‌شه. اگر لازم شد، باید به جدول `idea_tags` (many-to-many با `on delete cascade`) مهاجرت کنیم.

## قانون RLS مشترک بین همه‌ی جدول‌ها

هر ردیف فقط برای عضوهای همون workspace (از طریق `workspace_members`) قابل‌مشاهده/ویرایش است — نه بر اساس فیلتر سمت کلاینت (طبق docs/AUTHORIZATION.md).

## ستون و توابع Phase 3.5 (`0003_phase3_entry_date.sql`)

### `ideas.entry_date`
ستون جدید از نوع `date` (بدون زمان) — «روزی» که این رکورد به آن تعلق دارد در مدل ناوبری تاریخ‌محور (CAL-001، AD-009). همیشه میلادی خنثی ذخیره می‌شود؛ تبدیل به شمسی/قمری فقط در لایه‌ی نمایش (`src/i18n/calendarFormat.ts`) انجام می‌شود.

### `move_idea_to_date(p_idea_id, p_new_entry_date)`
تابع Postgres (`security invoker`) که `entry_date` یک رکورد موجود را مستقیماً تغییر می‌دهد — تنها راه مجاز برای این کار، نه یک `update` خام از کلاینت.

### `copy_idea_to_date(p_idea_id, p_new_entry_date)`
تابع Postgres (`security invoker`) که یک رکورد جدید با همان محتوا ولی `entry_date` جدید می‌سازد؛ اصل دست‌نخورده باقی می‌ماند.

هر دو تابع `security invoker` هستند (نه `definer`) — یعنی از سیاست‌های RLS موجود روی `ideas` (`ideas_all_member`) استفاده می‌کنند، پس هیچ افزایش سطح دسترسی جدیدی معرفی نمی‌شود.

## چطور migration ها رو اجرا کنم؟

داخل Supabase Dashboard پروژه‌ت، برو به SQL Editor. به همین ترتیب اجرا کن (هر کدوم به قبلی وابسته‌ست): اول `0001_phase2_core_domain.sql`، بعد `0002_phase3_ideas.sql`، بعد `0003_phase3_entry_date.sql`. اگر بعداً Supabase CLI نصب کردی، می‌تونی به‌جاش `supabase db push` بزنی.
