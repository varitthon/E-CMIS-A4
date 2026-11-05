"""Build activity10/screenshots/index.xlsx from rows written by capture-screens.js.

Usage: python shots-index-xlsx.py <rows.json> <out.xlsx>
Sheets: shots (1 row = 1 image, hyperlinked) · summary (1 row = 1 step).
"""
import json
import sys
from collections import OrderedDict

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

HEADER_FILL = PatternFill("solid", fgColor="1E3A8A")
HEADER_FONT = Font(bold=True, color="FFFFFF")
LINK_FONT = Font(color="1D4ED8", underline="single")
WARN_FILL = PatternFill("solid", fgColor="FEF3C7")

SHOT_COLS = [
    ("act", "กิจกรรม", 8), ("graph", "แผนผัง", 34), ("key", "nodeKey", 26), ("label", "ขั้น", 46),
    ("page", "หน้า", 44), ("role", "บทบาท", 20), ("caseId", "เคส", 26), ("branch", "branch", 10),
    ("branchLabel", "ทางเลือก", 34), ("part", "ส่วน", 6), ("file", "ภาพ", 50), ("thumb", "thumb", 50),
    ("errors", "errors", 40), ("capturedAt", "capturedAt", 22),
]
SHOT_KEYS = [c[0] for c in SHOT_COLS]


def style_header(ws, widths):
    for i, w in enumerate(widths, start=1):
        cell = ws.cell(row=1, column=i)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(vertical="center")
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = ws.dimensions


def link(cell, target):
    cell.hyperlink = target  # relative to index.xlsx (same folder as the images)
    cell.font = LINK_FONT


def build_shots(wb, rows):
    ws = wb.active
    ws.title = "shots"
    ws.append([c[1] for c in SHOT_COLS])
    for r in rows:
        ws.append([r.get(k, "") for k in SHOT_KEYS])
        row = ws.max_row
        for col_key in ("file", "thumb"):
            if r.get(col_key):
                link(ws.cell(row=row, column=SHOT_KEYS.index(col_key) + 1), r[col_key])
        if r.get("errors"):
            for i in range(1, len(SHOT_COLS) + 1):
                ws.cell(row=row, column=i).fill = WARN_FILL
    style_header(ws, [c[2] for c in SHOT_COLS])


def build_summary(wb, rows):
    summary = OrderedDict()
    for r in rows:
        s = summary.setdefault(r["key"], {
            "act": r.get("act", ""), "key": r["key"], "label": r.get("label", ""), "page": r.get("page", ""),
            "role": r.get("role", ""), "shots": 0, "branches": set(), "first": "", "errors": r.get("errors", ""),
        })
        if r.get("file"):
            s["shots"] += 1
            s["branches"].add(r.get("branch") or "default")
            if not s["first"]:
                s["first"] = r["file"]
    ws = wb.create_sheet("summary")
    ws.append(["กิจกรรม", "nodeKey", "ขั้น", "หน้า", "บทบาท", "จำนวนภาพ", "จำนวนทางเลือก", "ภาพแรก", "errors"])
    for s in summary.values():
        ws.append([s["act"], s["key"], s["label"], s["page"], s["role"], s["shots"], len(s["branches"]), s["first"], s["errors"]])
        row = ws.max_row
        if s["first"]:
            link(ws.cell(row=row, column=8), s["first"])
        if s["errors"] or not s["shots"]:
            for i in range(1, 10):
                ws.cell(row=row, column=i).fill = WARN_FILL
    style_header(ws, [8, 26, 46, 44, 20, 10, 12, 50, 40])


def main():
    if len(sys.argv) != 3:
        sys.exit("usage: shots-index-xlsx.py <rows.json> <out.xlsx>")
    with open(sys.argv[1], encoding="utf-8") as f:
        rows = json.load(f)
    wb = Workbook()
    build_shots(wb, rows)
    build_summary(wb, rows)
    wb.save(sys.argv[2])
    print("index.xlsx:", len(rows), "rows")


if __name__ == "__main__":
    main()
