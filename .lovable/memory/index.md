ระบบบริหารจัดการกิจนิมนต์พระ - project design rules, architecture, and feature decisions

## Design
- **Colors:** Brick orange (#B85C2D / HSL 16 65% 45%), cream, white — Thai temple aesthetic
- **Font:** Noto Sans Thai
- **Data:** localStorage (v1), planned for Google Sheets + Cloudflare Workers

## Queue Logic
- Smart rotation using **activityScore** (highest first), NOT queueScore
- **4 Ranks:** มหาเถระ(19), เถระ(7), มัชฌิมะ(2), นวกะ(4)
- Specified monks always included first in draft
- Auto-substitute on rejection (highest activityScore next available)

## Roles (v2)
- **NO Building Head** — removed entirely
- **User (พระ/สามเณร):** self-service accept/reject via dashboard
- **Admin:** create ceremonies, generate queue, view history
- Monk availability: toggle พร้อม/ไม่พร้อม (requires reason)
- Accept mode: รับงานทั่วไป / รับเฉพาะงานเจาะจง

## Pages
- `/` (HomePage) — public calendar, monk dashboard (if monk), contact
- `/admin` — create ceremonies, queue by activityScore, communal check-in, history
- `/request` — LayPerson form
- `/monk` — Chant selection + lead chanter criteria
- `/queue` — Queue monitoring
- `/history` — Past ceremonies

## Ceremony Types
- มงคล, อวมงคล, ใส่บาตรและเจริญพระพุทธมนต์, งานส่วนรวมของวัด

## Removals
- Building Head page and role (removed in v2)
- MealOption simplified to ไม่มี/ภัตตาหาร (no ปิ่นโต)
