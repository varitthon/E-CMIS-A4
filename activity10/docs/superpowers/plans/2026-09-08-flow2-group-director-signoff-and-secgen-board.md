# Plan: Insert ผอ.กลุ่ม Sign-off Steps + เลขาธิการ (Board) Page — 10-2-xx Flow

**Date:** 2026-09-08
**Scope:** `activity10/assets/ecmis-10-2.js`, `activity10/assets/ecmis-activity10.js`, 6 new page files
**Not in scope:** reject/send-back logic (pages are simple pass-through), round-2 board page (stays a black box)

## Why

Audited the 10-2-xx flow against the canonical role pattern:

> ธุรการ → ผอ.กอง (มอบหมาย) → ผอ.กลุ่ม (มอบหมาย) → เลขา (sign pass/reject) → ผอ.กลุ่ม (sign pass/reject) → ผอ.กอง (ลงนาม)

Found 5 places where เลขานุการฯ hands off straight to ผอ.กองกฎหมาย, skipping ผอ.กลุ่มงานความเห็นแย้ง. Also, "กิจกรรมที่ 7" (the board/เลขาธิการ activity) has no page — it was previously treated as a black box, but the `secgen` role now exists and should get a real (simple) page for round 1.

## Change 1 — Insert ผอ.กลุ่ม sign-off step in 5 places

All 5 new pages are **simple pass-through**: view the case + the document เลขานุการฯ prepared, click "ลงนาม/ส่งต่อ ผอ.กองกฎหมาย". No reject path.

| # | Branch | Before | New page | After |
|---|---|---|---|---|
| 1 | Part 1 main flow | 10-2-07 (เลขา: จัดทำผลมติ) | **10-2-18-group-director-sign-propose.html** | 10-2-08 (ผอ.กอง: ลงนามเสนอ) |
| 2 | DENY branch | 10-2-15 (เลขา: บันทึกไม่อนุญาต) | **10-2-19-group-director-sign-deny.html** | 10-2-16 (ผอ.กอง: ลงนามเสนอ) |
| 3 | CLOSED branch | 10-2-22 (เลขา: บันทึกมติเปิดเผย) | **10-2-20-group-director-sign-close.html** | 10-2-23 (ผอ.กอง: ลงนามเสนอ) |
| 4 | Round-2 referral branch | 10-2-25 (เลขา: ร่างบันทึกเสนอเลขาธิการ) | **10-2-21-group-director-sign-committee.html** | 10-2-26 (ผอ.กอง: ให้ความเห็น) |
| 5 | Notice/redaction branch | 10-2-12 (เลขา: ปกปิดข้อมูล) | **10-2-27-group-director-sign-notice.html** | 10-2-13 (ผอ.กอง: ลงนามหนังสือ) |

Each new page:
- `role: "group_director"`, `roleTitle: "ผู้อำนวยการกลุ่มงานความเห็นแย้ง"`
- New `statusCode` per insertion point (5 new codes, e.g. `L2_PENDING_GROUP_SIGN_PROPOSE`, `L2_PENDING_GROUP_SIGN_DENY`, `L2_PENDING_GROUP_SIGN_CLOSE`, `L2_PENDING_GROUP_SIGN_COMMITTEE`, `L2_PENDING_GROUP_SIGN_NOTICE`)
- Because these insertions sit at branch boundaries (same situation as the existing DENY/CLOSE/COMMITTEE boundaries), `ROUTES` needs explicit overrides after the `STEPS.reduce(...)` auto-build — same pattern already used for `L2_PENDING_DENY_MEMO` / `L2_PENDING_CLOSE_MEMO` / `L2_PENDING_COMMITTEE_MEMO_DRAFT` today. Auto-adjacency will get at least gap #1 wrong (10-2-07 sits right before what's currently 10-2-08 in array order) and needs a matching manual fix + deletion of any wrongly auto-generated route, mirroring the existing comments in the file.
- No sidebar/menu code changes needed — `renderSidebarMenu()` in `01-work-inbox.html` already builds the group_director's 10-2-xx menu section generically from `Activity102.STEPS`.

## Change 2 — เลขาธิการ (secgen) board page, round 1 only

Insert **10-2-28-secgen-board-decision.html** between 10-2-09 (ธุรการ: ส่งกิจกรรมที่ 7) and 10-2-10 (ธุรการ: รับมติ).

- `role: "secgen"`, `roleTitle: "เลขาธิการ คณะกรรมการ ป.ป.ท. ผู้ดูแลกองกฎหมาย"`
- Simple pass-through: view the case, the subcommittee's proposed resolution (`l2ResolutionType`/`l2CommitteeOpinion`), and the ผอ.กองกฎหมาย's signed proposal — then click to record the board's endorsement and forward.
- New `statusCode`: `L2_PENDING_BOARD_DECISION` (replaces `L2_READY_FOR_BOARD` as what 10-2-09 now produces); this page's action sets `L2_BOARD_RESOLVED`, same as today.
- **Round 2 is explicitly unchanged** — after 10-2-29 the flow still goes straight through the same implicit black-box into 10-2-30, no new page there.
- No sidebar/menu code changes needed, same reason as above — the STEPS-driven loop covers any role automatically, including `secgen`.

### Wording revisions (2026-09-08 follow-up)

Now that 10-2-09 dispatches to a *named* role (เลขาธิการ) instead of a vague "ผู้บริหาร", and that role gets a real page, the status text needs to be specific too:

| Field | Old text | New text |
|---|---|---|
| 10-2-09 `label` (the action itself) | ธุรการกองกฎหมาย ออกเลขส่งและเสนอผู้บริหาร | ธุรการกองกฎหมาย ออกเลขส่งและเสนอเลขาธิการ คณะกรรมการ ป.ป.ท. ผู้ดูแลกองกฎหมาย |
| `L2_PENDING_BOARD_DECISION` status text (case queued waiting for 10-2-28) | *(new status, no prior text)* | รอเสนอเลขาธิการ คณะกรรมการ ป.ป.ท. ผู้ดูแลกองกฎหมาย |
| `L2_BOARD_RESOLVED` status text (case queued waiting for 10-2-10) — currently hardcoded on every sample case object in `ecmis-activity10.js` (8 occurrences today, 9 after this plan's sample-data addition) | มติบอร์ดตอบกลับแล้ว รอธุรการตรวจรับ (กิจกรรมที่ 7) | เลขาธิการตอบกลับแล้ว รอธุรการตรวจรับ (กิจกรรมที่ 7) |

The `L2_BOARD_RESOLVED` text edit touches every existing sample case with that status (`คำร้อง-100010, 100011, 100012, 100025, 100026, 100027, 100028, 100031`) plus the new one added by this plan — all in `assets/ecmis-activity10.js`.

### ผอ.กลุ่ม ordering — verified

Rechecked all 5 insertions from Change 1: every one is เลขา → ผอ.กลุ่ม → ผอ.กอง, with no insertion landing before เลขา or after ผอ.กอง. Order confirmed correct.

## Change 3 — Sample data

Each of the 6 new statuses currently has zero test cases (same gap noted in the earlier flow review). Add one sample case per new status, in `ecmis-activity10.js`, with `assignedRole` set correctly (`"group_director"` for the 5 sign-off cases, `"secgen"` for the board case) so they show up correctly in `getCasesForRole()` — no other filtering logic changes needed there since it already reads `assignedRole` generically.

## Files touched

| File | Change |
|---|---|
| `assets/ecmis-10-2.js` | 6 new `STEPS` entries, 6 new `ROUTES` overrides (+ deletions of wrong auto-generated ones, matching existing pattern) |
| `assets/ecmis-activity10.js` | 6 new sample cases (1 per new status) |
| 6 new `10-2-XX-*.html` files | Cloned from the closest existing simple pass-through page (e.g. `10-2-04-group-director-verify.html` style) and adapted per step |
| `01-work-inbox.html` | No code changes expected — routing, sidebar menu, and role filtering are already generic/data-driven |

## Open risk

`Activity102.ROUTES` is auto-built from array adjacency, then patched with manual overrides for every existing branch boundary. Inserting 6 new steps means 6 more places where adjacency will guess wrong and need a manual override + deletion, same as the existing pattern — this is mechanical but needs to be done carefully one at a time and verified against the case-status-map (which page a given `statusCode` actually resolves to) rather than assumed from array position.
