import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CandidateRow } from "@/lib/types";
import { parseFlexibleDate } from "@/lib/dates";
import { getSessionUser, unauthorized, forbidden } from "@/lib/auth";
import { createBackup } from "@/lib/backup";

export async function GET(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  const url = req.nextUrl;
  const search = url.searchParams.get("search")?.trim().toLowerCase() || "";
  const expertFilter = url.searchParams.get("expert")?.trim() || "";
  const score = url.searchParams.get("score")?.trim() || "";
  const resumeStatus = url.searchParams.get("resumeStatus")?.trim() || "";
  const mockDone = url.searchParams.get("mockDone")?.trim() || "";

  const all = await db.candidate.findMany({ orderBy: { dbCreatedAt: "desc" } });
  const scoped = me.role === "admin" ? all : all.filter((c) => c.expert === me.expertEmail);
  const filtered = scoped.filter((c) => {
    if (search) {
      const haystack = [c.candidateName, c.expert, c.teamLead, c.mock1Recording, c.mock2Recording, c.mock3Recording, c.feedback].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (expertFilter && c.expert !== expertFilter) return false;
    if (score && (c.score || "").toLowerCase() !== score.toLowerCase()) return false;
    if (resumeStatus && (c.resumeStatus || "").toLowerCase() !== resumeStatus.toLowerCase()) return false;
    if (mockDone === "yes" && (c.mock1Done || "").toLowerCase() !== "yes") return false;
    if (mockDone === "no" && (c.mock1Done || "").toLowerCase() === "yes") return false;
    return true;
  });
  return NextResponse.json({ rows: filtered.map(toRow) });
}

export async function POST(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  if (me.role !== "admin") return forbidden();
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  const data = normalizeInput(body);
  const created = await db.candidate.create({ data });
  createBackup().catch((e) => console.error("[backup] failed after candidate POST:", e));
  return NextResponse.json({ row: toRow(created) });
}

export function normalizeInput(input: Record<string, unknown>) {
  const str = (v: unknown) => { if (v === null || v === undefined) return null; const s = String(v).trim(); return s === "" ? null : s; };
  const required = (v: unknown, fallback = "") => { const s = str(v); return s === null ? fallback : s; };
  return {
    candidateName: required(input.candidateName),
    expert: required(input.expert),
    teamLead: required(input.teamLead, "Ravikant Raj"),
    resumeStatus: required(input.resumeStatus, "pending").toLowerCase(),
    mockReportSent: required(input.mockReportSent, "No"),
    createdAt: parseFlexibleDate(input.createdAt),
    updatedAt: parseFlexibleDate(input.updatedAt),
    score: str(input.score),
    communication: str(input.communication),
    technicalKnowledge: str(input.technicalKnowledge),
    coding: str(input.coding),
    mock1Done: str(input.mock1Done),
    mock1Recording: str(input.mock1Recording),
    mock1Feedback: str(input.mock1Feedback),
    mock1NextDate: parseFlexibleDate(input.mock1NextDate),
    mock2Done: str(input.mock2Done),
    mock2Recording: str(input.mock2Recording),
    mock2Feedback: str(input.mock2Feedback),
    mock2NextDate: parseFlexibleDate(input.mock2NextDate),
    mock2DelayReason: str(input.mock2DelayReason),
    mock3Done: str(input.mock3Done),
    mock3Recording: str(input.mock3Recording),
    mock3Feedback: str(input.mock3Feedback),
    mock3NextDate: parseFlexibleDate(input.mock3NextDate),
    mock3DelayReason: str(input.mock3DelayReason),
    reasonNotDone: str(input.reasonNotDone),
    feedback: str(input.feedback),
  };
}

export function toRow(c: { id: string; candidateName: string; expert: string; teamLead: string; resumeStatus: string; mockReportSent: string; createdAt: string | null; updatedAt: string | null; score: string | null; communication: string | null; technicalKnowledge: string | null; coding: string | null; mock1Done: string | null; mock1Recording: string | null; mock1Feedback: string | null; mock1NextDate: string | null; mock2Done: string | null; mock2Recording: string | null; mock2Feedback: string | null; mock2NextDate: string | null; mock2DelayReason: string | null; mock3Done: string | null; mock3Recording: string | null; mock3Feedback: string | null; mock3NextDate: string | null; mock3DelayReason: string | null; reasonNotDone: string | null; feedback: string | null; }): CandidateRow {
  return { id: c.id, candidateName: c.candidateName, expert: c.expert, teamLead: c.teamLead, resumeStatus: c.resumeStatus, mockReportSent: c.mockReportSent, createdAt: c.createdAt, updatedAt: c.updatedAt, score: c.score, communication: c.communication, technicalKnowledge: c.technicalKnowledge, coding: c.coding, mock1Done: c.mock1Done, mock1Recording: c.mock1Recording, mock1Feedback: c.mock1Feedback, mock1NextDate: c.mock1NextDate, mock2Done: c.mock2Done, mock2Recording: c.mock2Recording, mock2Feedback: c.mock2Feedback, mock2NextDate: c.mock2NextDate, mock2DelayReason: c.mock2DelayReason, mock3Done: c.mock3Done, mock3Recording: c.mock3Recording, mock3Feedback: c.mock3Feedback, mock3NextDate: c.mock3NextDate, mock3DelayReason: c.mock3DelayReason, reasonNotDone: c.reasonNotDone, feedback: c.feedback };
}
