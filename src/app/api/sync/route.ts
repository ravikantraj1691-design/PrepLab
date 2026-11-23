import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/dates";
import { getSessionUser, unauthorized, forbidden } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  if (me.role !== "admin") return forbidden();
  const settings = await db.setting.findMany();
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;
  const appsScriptUrl = map.appsScriptUrl?.trim();
  if (!appsScriptUrl) return NextResponse.json({ error: "Apps Script URL is not set. Open Settings to configure it." }, { status: 400 });
  const all = await db.candidate.findMany({ orderBy: { dbCreatedAt: "desc" } });
  if (all.length === 0) return NextResponse.json({ error: "No candidates to sync" }, { status: 400 });
  const header = ["Created","Candidate","Expert","Team Lead","Resume Status","Updated At","Mock Report Sent?","Score","Communication","Technical Knowledge","Coding","Mock 1","Mock 1 Recording","Feedback after mock","date for next mock report","Mock 2","Mock 2 Recording","Mock 3","Mock 3 Recording","Reason (if not done)","Feedback"];
  const rows = all.map((c) => [formatDateTime(c.createdAt),c.candidateName||"",c.expert||"",c.teamLead||"",c.resumeStatus||"",formatDateTime(c.updatedAt),c.mockReportSent||"",c.score||"",c.communication||"",c.technicalKnowledge||"",c.coding||"",c.mock1Done||"",c.mock1Recording||"",c.mock1Feedback||"",formatDate(c.mock1NextDate),c.mock2Done||"",c.mock2Recording||"",c.mock3Done||"",c.mock3Recording||"",c.reasonNotDone||"",c.feedback||""]);
  try {
    const resp = await fetch(appsScriptUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "replace", header, rows }), redirect: "follow" });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return NextResponse.json({ error: `Apps Script responded ${resp.status}: ${text.slice(0, 300)}` }, { status: 502 });
    }
    let parsed: unknown = null;
    try { parsed = await resp.json(); } catch { parsed = await resp.text(); }
    return NextResponse.json({ ok: true, synced: rows.length, response: parsed });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Failed to call Apps Script: ${msg}` }, { status: 502 });
  }
}
