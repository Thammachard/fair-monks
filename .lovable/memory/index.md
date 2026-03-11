ระบบบริหารจัดการกิจนิมนต์พระ - project design rules, architecture, and feature decisions

## Design
- **Colors:** Gold (#B8860B), maroon, cream — Thai temple aesthetic
- **Font:** Noto Sans Thai
- **Data:** localStorage (v1), planned for Google Sheets + Cloudflare Workers

## Queue Logic
- Smart rotation, not random. Fairness-based with cross-rank substitution
- **4 Ranks:** มหาเถระ(19), เถระ(7), มัชฌิมะ(2), นวกะ(4)
- **Approve rules:** approve→end of queue, sick→freeze at head, skip→penalty to end
- **Activity score:** 1-5 from กิจ (ทำวัตร, ทำงาน, เรียน)

## Pages
- `/` (HomePage) — public calendar, ceremony details, contact info
- `/admin` — Admin create ceremonies, approve requests from โยม
- `/request` — LayPerson form to submit nimmon requests
- `/monk` — Monk/novice chant selection + lead chanter criteria
- `/building-head` — Building head approve/reject with dropdown reasons + sermon topic
- `/queue` — Queue monitoring
- `/history` — Past ceremonies

## Chanting System
- 3 categories: ให้พร, มงคล, อวมงคล (defined in src/lib/chantingData.ts)
- Lead chanter criteria: ให้ศีล5, ให้ศีล8, บรรยายธรรม, จบนักธรรมเอก
- Monks select which chants they can do via checkboxes

## Rejection Reasons (dropdown)
- อาพาธ, ติดสอบบาลี, ติดสอบนักธรรม, ติดธุระส่วนตัว, เดินทางไม่ได้, สละสิทธิ์, อื่นๆ
