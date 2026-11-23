import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { parseFlexibleDate } from "@/lib/dates";
import { normalizeInput } from "../candidates/route";
import { getSessionUser, unauthorized, forbidden } from "@/lib/auth";
import { createBackup } from "@/lib/backup";

export async function POST(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  if (me.role !== "admin") return forbidden();
  const url = req.nextUrl;
  const replace = url.searchParams.get("replace") === "1";
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing 'file' field" }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  let wb: XLSX.WorkBook;
  try { wb = XLSX.read(buf, { type: "buffer" }); } catch { return NextResponse.json({ error: "Could not parse xlsx file" }, { status: 400 }); }
  const sheetName = wb.SheetNames.find((n) => n.trim().toLowerCase() === "mock tracker") || wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  if (!ws || !ws["!ref"]) return NextResponse.json({ error: `Sheet "${sheetName}" not found or empty` }, { status: 400 });
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
  if (rows.length < 2) return NextResponse.json({ error: "Sheet has no data rows" }, { status: 400 });
  const header = (rows[0] as unknown[]).map((h) => String(h ?? "").trim().toLowerCase());
  const find = (...labels: string[]) => { for (const l of labels) { const i = header.findIndex((h) => h === l); if (i >= 0) return i; } return -1; };
  const idx = {
    createdAt: find("created"), candidate: find("candidate"), expert: find("expert"), teamLead: find("team lead"),
    resumeStatus: find("resume status"), updatedAt: find("updated at"), mockReportSent: find("mock report sent?"),
    score: find("score"), communication: find("communication"), technicalKnowledge: find("technical knowledge"),
    coding: find("coding"), mock1Done: find("mock 1"), mock1Recording: find("mock 1 recording"),
    mock1Feedback: find("feedback after mock"), mock1NextDate: find("date for next mock report"),
    mock2Done: find("mock 2"), mock2Recording: find("mock 2 recording"), mock3Done: find("mock 3"),
    mock3Recording: find("mock 3 recording"), reasonNotDone: find("reason (if not done)"), feedback: find("feedback"),
  };
  const cell = (r: unknown[], i: number): unknown => (i >= 0 && i < r.length ? r[i] : null);
  const strOrNull = (v: unknown) => { if (v === null || v === undefined) return null; const s = String(v).trim(); if (s === "" || s === "*") return null; return s; };
  const dataRows = rows.slice(1).filter((r) => { const arr = r as unknown[]; return strOrNull(cell(arr, idx.candidate)) || strOrNull(cell(arr, idx.expert)); });
  if (dataRows.length === 0) return NextResponse.json({ error: "No data rows found in the sheet" }, { status: 400 });
  if (replace) await db.candidate.deleteMany({});
  let inserted = 0; let skipped = 0;
  for (const r of dataRows) {
    const arr = r as unknown[];
    const candidateName = strOrNull(cell(arr, idx.candidate));
    if (!candidateName) { skipped++; continue; }
    const input = {
      candidateName, expert: strOrNull(cell(arr, idx.expert)) || "", teamLead: strOrNull(cell(arr, idx.teamLead)) || "Ravikant Raj",
      resumeStatus: strOrNull(cell(arr, idx.resumeStatus)) || "pending", mockReportSent: strOrNull(cell(arr, idx.mockReportSent)) || "No",
      createdAt: cell(arr, idx.createdAt), updatedAt: cell(arr, idx.updatedAt), score: strOrNull(cell(arr, idx.score)),
      communication: strOrNull(cell(arr, idx.communication)), technicalKnowledge: strOrNull(cell(arr, idx.technicalKnowledge)),
      coding: strOrNull(cell(arr, idx.coding)), mock1Done: strOrNull(cell(arr, idx.mock1Done)),
      mock1Recording: strOrNull(cell(arr, idx.mock1Recording)), mock1Feedback: strOrNull(cell(arr, idx.mock1Feedback)),
      mock1NextDate: parseFlexibleDate(cell(arr, idx.mock1NextDate)), mock2Done: strOrNull(cell(arr, idx.mock2Done)),
      mock2Recording: strOrNull(cell(arr, idx.mock2Recording)), mock3Done: strOrNull(cell(arr, idx.mock3Done)),
      mock3Recording: strOrNull(cell(arr, idx.mock3Recording)), reasonNotDone: strOrNull(cell(arr, idx.reasonNotDone)),
      feedback: strOrNull(cell(arr, idx.feedback)),
    };
    try { await db.candidate.create({ data: normalizeInput(input) }); inserted++; } catch { skipped++; }
  }
  createBackup().catch((e) => console.error("[backup] failed after import:", e));
  return NextResponse.json({ ok: true, inserted, skipped, total: dataRows.length, replace, sheetName });
}
