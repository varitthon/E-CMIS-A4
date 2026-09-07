# Flow 3 — per-recipient dispatch

**Date:** 07/09/2569 · **Status:** approved, not yet implemented
**Pages:** `17-legal-admin-external-dispatch-receive.html`, `18-officer-external-dispatch.html`,
`assets/ecmis-activity10.js`, `01-work-inbox.html`

## Why

Meeting note:

> (นิติกร) ต้องแจ้งผลด้วยถ้าส่งเห็นชอบกับความเห็นอัยการ = เห็นแย้งก็แจ้งทั้ง อสส และ อัยการ
> (จากเดิมที่กรอกเฉพาะกรณีไปยัง อสส)

Read as a rule:

| นิติกร's opinion | recipients |
|---|---|
| **เห็นชอบ** ตามคำสั่งอัยการ | อัยการต้นทาง only |
| **เห็นแย้ง** | อัยการต้นทาง **and** อสส. |

Three things in the current build contradict that:

1. **ธุรการ picks the recipients at `17`.** A human choice where the rule already
   determines the answer — and it can disagree with the opinion.
2. **The second recipient is second-class.** `18` has a full delivery form for the primary
   recipient and a four-field afterthought (`prosecutorRecipientName`,
   `prosecutorDispatchDate`, `prosecutorDispatchMethod`, `prosecutorTrackingNo`) behind a
   `แจ้งผลให้พนักงานอัยการเจ้าของสำนวนด้วย` checkbox. No post office, no hand-delivery
   detail, no receipt number, no attachment.
3. **One delivery, one save.** Both deliveries must be entered in a single sitting, though
   in practice they happen on different days and are recorded after the fact.

**Scope boundary — Flow 3 ends when both deliveries are recorded.** Flow 4 (the อสส.
ruling, page `19` onward) is a separate matter. This design preserves the values Flow 4
reads; it does not extend or redesign that routing.

## Prerequisite — already done

`18:823` inferred the opinion with a fallback to `title.includes('เห็นชอบ')`. Titles here
are *process* names (`พิจารณาความเห็นแย้ง…`), not outcomes, so a case whose title happened to
contain เห็นชอบ was classified agreed regardless of its real opinion. Demonstrated on seed
`คดี-100009/2569` (title contains `(เห็นชอบตามอัยการ)`): with a real เห็นแย้ง opinion, the old
expression evaluated `agreed`.

Under this design that would mean **never sending the file to อสส.** Fixed ahead of the
rework: the opinion now comes from `finalOpinionType` alone, a missing value defaults to
เห็นแย้ง, and the fallback is announced in an amber strip instead of applied silently.

## Architecture

### One derivation, shared

```js
// assets/ecmis-activity10.js
// เห็นชอบ  → ['prosecutor']
// เห็นแย้ง → ['oag', 'prosecutor']
// no finalOpinionType → treated as เห็นแย้ง (safe default; caller shows the warning)
function getRequiredRecipients(caseItem, opinionOverride)
```

Lives in the shared script because `17` and `18` both need it; a copy in either page would
drift. `opinionOverride` exists only for the test-scenario selector (below).

Safe default reasoning: over-notifying is recoverable, failing to reach อสส. is not.
This matches `ecmis-activity10.js:2028`, which already defaults to `case_disagreed`.

### Delivery record — one per recipient, identical shape

```js
dispatchRecipients: [{
  key:    'oag' | 'prosecutor',
  name:   'สำนักงานอัยการสูงสุด (อสส.)',
  method: 'postal_ems' | 'hand_delivery',   // chosen independently per recipient
  // postal_ems:    trackingNo, sentDate, postOffice
  // hand_delivery: sentDate, sentTime, receiveDocNo, receiverName, location
  savedAt: null | '07/09/2569'
}]
```

`savedAt` is the single source of the tab's status — null ⇒ amber ⚠ ยังไม่ได้กรอก, set ⇒
green ✅ บันทึกแล้ว. One field, so display and data cannot disagree.

**Attachments stay UI-only.** `18:538` has an `แนบไฟล์สลิป EMS` input, but no file or file
name is in today's payload and none is stored. This design does not change that — the input
is per-tab for consistency, still not persisted. Making attachments real is a separate
decision, and in a localStorage mock it would mean base64 in the case record.

**Dead store field noted:** `ecmis-activity10.js` writes `handDeliveryRecipientPosition`,
which `18` has never supplied. Left alone; not worth touching in this change.

`oagReceiveDocNo` becomes per-recipient `receiveDocNo`. The current hand-delivery branch
hardcodes `dispatchRecipientName = 'สำนักงานอัยการสูงสุด (อสส.)'` and labels the field
เลขรับ อสส. — wrong whenever the sole recipient is อัยการต้นทาง, i.e. every เห็นชอบ case.

### Backwards compatibility — flat fields by projection

Outside `18`, only **`19:578-580`** reads the flat delivery fields, and it reads them to
describe how the ความเห็นแย้ง reached อสส. — exactly one recipient's record.

On every save, project the **อสส.** record (or the sole recipient on a เห็นชอบ case) into the
existing `dispatchMethod` / `emsTrackingNo` / `oagReceiveDocNo` / `dispatchRecipientName`.
`19` and the store's status string then need no changes, which is what "Flow 4 is unrelated"
requires. The projection is write-time and one-way — `dispatchRecipients[]` is the source of
truth.

`dispatchScenario` (`case_agreed` / `case_disagreed`) and `dispatchRecipientType`
(`prosecutor_origin` / `attorney_general`) keep their present values, derived from the
opinion. `01-work-inbox.html:1712` and `:1933` route to page `19` on
`dispatchRecipientType === "attorney_general" || dispatchScenario === "case_disagreed"`, so a
เห็นชอบ case correctly never reaches `19` and a เห็นแย้ง case still does.

**Deleted:** `notifyProsecutor`, `prosecutorRecipientName`, `prosecutorDispatchDate`,
`prosecutorDispatchMethod`, `prosecutorTrackingNo`. Nothing outside `18` reads them.

## Page 17 — read-only

The recipient picker becomes a derived, read-only panel. ธุรการ verifies the signed document
and forwards; they do not choose the routing.

```
ส่งหนังสือไปที่  (ระบบกำหนดจากผลการพิจารณา)
┌──────────────────────────────────────────┐
│ ⚠ นิติกรเห็นแย้งคำสั่งอัยการ                  │
│   → ⚖ อัยการสูงสุด (อสส.)                    │
│   → 👤 พนักงานอัยการเจ้าของสำนวน              │
│   ตามมติที่ประชุม 01/09/2569                  │
└──────────────────────────────────────────┘
```

`dispatchTarget` is still written, as the derived string, so nothing reading it breaks.

## Page 18 — tabs

**Tab strip, always rendered**, one chip per required recipient:

```
┌ ⚖ อัยการสูงสุด (อสส.)  ✅ บันทึกแล้ว ┬ 👤 อัยการต้นทาง  ⚠ ยังไม่ได้กรอก ┐
```

A เห็นชอบ case has one recipient, so the strip degenerates to a single chip. Kept rather
than branching the layout: the chip still carries status, and it is one code path.

**Per-recipient form** — method selector plus that method's fields, scoped to the active tab.
EMS for อสส. and hand-delivery for อัยการ is simply two independent records.

**Save is per tab.** `บันทึกการจัดส่งหน่วยงานนี้` validates and saves only the active
recipient, sets its `savedAt`, flips the chip green. The case stays with the นิติกร.

**Completion is automatic on the last save.** When the final required recipient gets a
`savedAt`, the same call completes the case — `DISPATCHED_TO_PROSECUTOR`, `assignedRole` and
`workflowStep` as today. Flow 3 ends. A separate confirm button would only ever be pressed
immediately after the last save.

**Already-dispatched view** lists both records; `แก้ไข` returns to the tabs, prefilled.

**Test-scenario selector drops to two buttons — เห็นชอบ / เห็นแย้ง.** Today's three conflate
outcome with method; method is now per-recipient. The selector **overrides the opinion for
the session** (`opinionOverride`), so tabs, validation, saving and completion all follow what
is on screen — otherwise a tester could switch to เห็นชอบ, fill one tab, and store one
recipient against a case that needs two. It stays labelled as a test affordance.

## Work inbox

Status text carries progress: `นิติกรจัดส่งหนังสือ (บันทึกแล้ว 1/2)`. Without it a
half-recorded case is indistinguishable from an untouched one, and could sit for weeks
unnoticed. This is the one addition not explicitly requested.

## Edge cases

| case | behaviour |
|---|---|
| no `finalOpinionType` | both recipients + amber warning (already implemented) |
| scenario switched after a tab was saved | orphaned record **kept**, no longer required for completion — deleting a real delivery record because a demo toggle moved would be worse |
| editing a completed case | back to tabs, both records prefilled |
| เห็นชอบ case | never reaches `19`; falls out of the existing inbox condition unchanged |

## Testing

- เห็นชอบ renders 1 tab; เห็นแย้ง renders 2
- save one tab → case stays at `18`, chip green, inbox shows `1/2`
- save the second → case completes, Flow 3 ends
- mixed methods: EMS for one recipient, hand-delivery for the other
- `19:578-580` still renders the อสส. delivery correctly after projection
- a เห็นชอบ case still does not appear at `19`
- a case with no `finalOpinionType` shows both tabs and the warning
- no console errors on `17`, `18`, `19`, `01`

## Out of scope

Flow 4 and page `19`'s routing · the unstyled `.info-box` class · seeded case titles
containing `ความเห็นแย้ง` · the nine อสส-ruling labels on `19` (separate open item, needs a
lawyer — see `qa-findings-register.md` C4).
