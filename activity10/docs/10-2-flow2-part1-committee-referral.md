# Flow 2 revision — Part 1: ส่งเรื่องเข้าคณะกรรมการ ป.ป.ท. รอบ 2 (อนุญาต/อนุญาตบางส่วน × อยู่ระหว่างไต่สวน)

> **Status: PLAN ONLY — no pages built yet.** This documents the design before implementation, per request. Scope is **Part 1** only (ธุรการรับเรื่อง → จัดทำเอกสาร → sign chain → ส่งกิจกรรมที่ 7). **Part 2** (รับมติกลับจากกิจกรรมที่ 7 → แจ้งมติผู้ยื่นคำขอ, reusing 10-2-11–14) is a separate follow-up, not designed here yet.

## Why this changes the current Flow 2

Today, DISCLOSE/PARTIAL + อยู่ระหว่างไต่สวน (`INVESTIGATING`) is the **only** one of the 3 resolution outcomes that skips a second trip through the ป.ป.ท. committee — 10-2-10 routes straight to the notice-drafting pages (10-2-11 → 14). DENY (Flow 1) and DISCLOSE/PARTIAL + คดีเสร็จสิ้นแล้ว (Flow 3) both already go through a short committee-referral round first (10-2-15→17, 10-2-22→24).

New reference documents in `docs/10.2 mockup/Part 1 - new 2/` and `docs/10.2 mockup/Part 2 - new 1/` (with `.fields.md` breakdowns already extracted) show INVESTIGATING should **also** go through a committee round — this one closer to the *original* full process (multi-level sign-off up to เลขาธิการ) rather than the shortened 3-step pattern used for DENY/CLOSED. This doc plans that round.

## Net effect on routing

```
10-2-10 (ธุรการยืนยันมติ+สถานะคดี)
   │
   ├── DISCLOSE/PARTIAL + CLOSED         → unchanged → Flow 3 (10-2-22→24)
   ├── DENY                              → unchanged → Flow 1 (10-2-15→17)
   └── DISCLOSE/PARTIAL + INVESTIGATING  → CHANGED:
           was:  → L2_PENDING_NOTICE_DRAFT → 10-2-11 (direct)
           now:  → L2_PENDING_COMMITTEE_MEMO_DRAFT → [NEW Part 1, this doc]
                     → ... → L2_READY_FOR_BOARD_ROUND2 (holding, no action button —
                        waiting for the real กิจกรรมที่ 7 reply, same idea as
                        L2_READY_FOR_BOARD after 10-2-09)
                     → [Part 2, future] receive real committee reply
                     → L2_PENDING_NOTICE_DRAFT → 10-2-11 (reused, unchanged)
```

**10-2-11 through 10-2-14 are not modified** — they still start from `L2_PENDING_NOTICE_DRAFT` exactly as today. Only what *sets* that status for this branch changes (now set by the new Part-2 receive step instead of directly by 10-2-10).

## New pages (Part 1)

Numbering continues from the last existing page, `10-2-24`. **Revised:** the separate รองเลขาธิการฯ/เลขาธิการฯ opinion steps (originally `10-2-27`/`10-2-28`) were removed after review — `dir_legal`'s opinion at `10-2-26` now routes straight to `admin_legal`'s dispatch at `10-2-29`, which was relabeled to say it sends to รองเลขาธิการ ป.ป.ท. instead of the full committee. `10-2-27` and `10-2-28` have been deleted; page numbers 27/28 are retired (not reused) to avoid confusion with the routing history below.

| # | หน้า | บทบาท (role id) | ทำอะไร | เอกสารที่เกี่ยวข้อง |
| --- | --- | --- | --- | --- |
| 1 | `10-2-25-secretariat-committee-memo-draft.html` | `sub_secretariat` | จัดทำ **มติคณะอนุกรรมการกลั่นกรอง** (attachment, auto-filled) + ร่าง **มติการประชุมอนุกรรมการฯ ที่นำเสนอเลขาธิการ** (memo) และลงนามช่อง "ผู้เสนอเรื่อง (อนุกรรมการและเลขานุการ)" | ทั้ง 2 เอกสาร |
| 2 | `10-2-26-legal-director-committee-opinion.html` | `dir_legal` | อ่าน + กรอกความเห็น + ลงนาม ข้อ 5 "ความเห็นผู้อำนวยการกองกฎหมาย" | memo (ข้อ 5) |
| 3 | `10-2-29-legal-admin-committee-dispatch.html` | `admin_legal` | ออกเลขหนังสือส่ง → ส่งเสนอรองเลขาธิการ ป.ป.ท. (เข้าสู่กิจกรรมที่ 7 คณะกรรมการ ป.ป.ท. ประชุม รอบ 2) — จบ Part 1 | — |

`secgen` (เลขาธิการ ป.ป.ท., login `Apichat.S`) and `deputy_sg` (login `Surapong.W`) still exist as roles/logins in `ECMIS.ROLES` (`ecmis-app.js`) for other flows, but are no longer part of this Part 1 chain.

## Status codes (new)

| statusCode | ชื่อสถานะ (แสดงใน 01-work-inbox.html) | ตั้งโดย | เคลียร์โดย (routes to) |
| --- | --- | --- | --- |
| `L2_PENDING_COMMITTEE_MEMO_DRAFT` | ฝ่ายเลขานุการฯ จัดทำมติคณะอนุกรรมการฯ และบันทึกเสนอเลขาธิการ | 10-2-10 (แทนที่ `L2_PENDING_NOTICE_DRAFT` เดิม เฉพาะสาขานี้) | 10-2-25 |
| `L2_PENDING_COMMITTEE_DIRECTOR_OPINION` | ผอ.กองกฎหมายพิจารณาให้ความเห็น | 10-2-25 | 10-2-26 |
| `L2_PENDING_COMMITTEE_DISPATCH` | ธุรการกองกฎหมายออกเลขส่งเสนอรองเลขาธิการ ป.ป.ท. | 10-2-26 | 10-2-29 |
| `L2_READY_FOR_BOARD_ROUND2` | รอเสนอมติบอร์ด รอบ 2 (กิจกรรมที่ 7) | 10-2-29 | *(none yet — Part 2, future)* |

## Field mapping — เอกสาร 1: มติคณะอนุกรรมการกลั่นกรอง (attachment, 9 fields, no signature block)

Per its own `.fields.md` note, this looks like a formatted **print view of data already captured at 10-2-06** — confirmed against the current `INITIAL_CASES` schema:

| Field key | มาจากไหน |
| --- | --- |
| `subject` | `title` (คำร้อง) |
| `facts` | net-new — not currently captured verbatim anywhere; closest existing field is `l2ResolutionDetail` |
| `disclosure_request` | `requestedInfo` |
| `meeting_no` | `l2MeetingNo` |
| `meeting_date` | `l2MeetingDate` |
| `committee_opinion` | `l2CommitteeOpinion` |
| `resolution` | derived from `l2ResolutionType`/`l2ResolutionTypeName` + `l2ResolutionDetail` |
| `data_owner` (ผู้รับผิดชอบข้อมูลข่าวสาร) | net-new — no current field; likely maps to `officer`/`assignedRole` at time of drafting, needs a decision |

So this page is mostly a **read-only rendering** of existing fields, plus 2 new inputs (`facts`, `data_owner`) to fill at 10-2-25.

## Field mapping — เอกสาร 2: มติการประชุมอนุกรรมการฯ ที่นำเสนอเลขาธิการ (memo, single-level sign chain)

| Section | Fields | หน้า/บทบาทที่กรอก |
| --- | --- | --- |
| Header (1–7) | `division_name`, `division_phone`, `doc_number`, `doc_date`, `subject`, `subject_meeting_no`, `addressed_to` | 10-2-25, mostly defaults + `issueDocNo()` pattern like existing pages |
| Body (8–15) | `background`, `meeting_no`, `meeting_date`, `meeting_venue`, `meeting_resolution`, `legal_basis`, `considerations`, `closing_statement` | 10-2-25 — `meeting_no`/`meeting_date` can prefill from `l2MeetingNo`/`l2MeetingDate`; `meeting_resolution` from `l2CommitteeOpinion`/resolution text; `background`, `meeting_venue`, `legal_basis`, `considerations` are net-new free text |
| ผู้เสนอเรื่อง (16–20) | `proposer_name`, `proposer_position`, `proposer_committee_role` (fixed text), `proposer_signature`, `proposer_sign_date` | 10-2-25, signs as `sub_secretariat` |
| ความเห็น ผอ.กกม. (21–23) | `opinion_legal_director`, `legal_director_signature`, `legal_director_sign_date` | 10-2-26, `dir_legal` — final opinion before dispatch (รองเลขาธิการ/เลขาธิการ opinion sections removed, see revision note above) |

## Explicitly out of scope this round

- Part 2 (receiving the real กิจกรรมที่ 7 reply after `L2_READY_FOR_BOARD_ROUND2`, and handing off into reused 10-2-11) — separate design pass later, per your message.
- No changes to 10-2-11 through 10-2-14.
- No changes to Flow 1 (DENY) or Flow 3 (CLOSED) — this only touches DISCLOSE/PARTIAL + INVESTIGATING.
- Sample data for the new statuses/pages — not added yet; will follow the same pattern as `100025`–`100028` once pages exist.

## Decisions (resolved)

1. **`facts` / `data_owner`** (เอกสาร 1) — free-text inputs at 10-2-25, pre-filled with sample/placeholder demo text (not derived from any existing field).
2. **เอกสาร 1 rendering** — print-style attachment view mimicking the original template layout (like 10-2-17's DENY notice mirrors its PDF).
3. **เอกสาร 2 UI pattern** — split by page:
   - **10-2-25** (`sub_secretariat` drafts): Tiptap rich-text editor + live split-preview, same pattern as 10-2-15/10-2-22, covering เรื่องเดิม/ข้อเท็จจริง/ข้อกฎหมาย/ข้อพิจารณา + meeting fields + their own proposer signature.
   - **10-2-26** (`dir_legal`): read-only render of the drafted document + that role's own opinion textarea + signature block only — no editor. This is now the last opinion step before dispatch.
4. **`ROLE_DISPLAY` gap** — `secgen` still has no entry in `ecmis-shell.js`'s `ROLE_DISPLAY`; no longer needed for this chain since `secgen` isn't part of Part 1 anymore, but left open for whichever other flow needs it.
5. **Simpler 2-signer memo from `Part 1 - new 2`** — dropped, not used anywhere in this round.
6. **Revision — dropped the รองเลขาธิการฯ/เลขาธิการฯ opinion steps** (originally `10-2-27`/`10-2-28`): `10-2-26`'s dir_legal opinion now routes straight to `10-2-29`'s dispatch, relabeled to say it sends to รองเลขาธิการ ป.ป.ท. instead of the full committee. Both files deleted; sample data and the STEPS table updated to match.
6. **Sample data** — add alongside the pages (same pattern as `100025`–`100028`), covering all 6 new statuses so the whole Part 1 chain is testable via 01-work-inbox.html immediately.
