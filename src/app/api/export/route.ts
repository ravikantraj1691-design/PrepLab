import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/dates";
import { getSessionUser, unauthorized, forbidden } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  if (me.role !== "admin") return forbidden();
  const all = await db.candidate.findMany({ orderBy: { dbCreatedAt: "desc" } });
  const header = ["Created","Candidate","Expert","Team Lead","Resume Status","Updated At","Mock Report Sent?","Score","Communication","Technical Knowledge","Coding","Mock 1","Mock 1 Recording","Feedback after mock","date for next mock report","Mock 2","Mock 2 Recording","Mock 3","Mock 3 Recording","Reason (if not done)","Feedback"];
  const data = all.map((c) => [formatDateTime(c.createdAt),c.candidateName||"",c.expert||"",c.teamLead||"",c.resumeStatus||"",formatDateTime(c.updatedAt),c.mockReportSent||"",c.score||"",c.communication||"",c.technicalKnowledge||"",c.coding||"",c.mock1Done||"",c.mock1Recording||"",c.mock1Feedback||"",formatDate(c.mock1NextDate),c.mock2Done||"",c.mock2Recording||"",c.mock3Done||"",c.mock3Recording||"",c.reasonNotDone||"",c.feedback||""]);
  const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
  ws["!cols"] = header.map((h) => ({ wch: Math.max(12, Math.min(50, h.length + 6)) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Mock Tracker");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(buf, { status: 200, headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="mock-tracker-${Date.now()}.xlsx"` } });
}
