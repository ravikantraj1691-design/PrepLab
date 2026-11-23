import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toRow } from "../candidates/route";
import { getSessionUser, unauthorized } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  const all = await db.candidate.findMany();
  const scoped = me.role === "admin" ? all : all.filter((c) => c.expert === me.expertEmail);
  const experts = me.role === "admin" ? Array.from(new Set(scoped.map((c) => c.expert).filter(Boolean))).sort() : me.expertEmail ? [me.expertEmail] : [];
  const perExpert = experts.map((e) => ({ expert: e, count: scoped.filter((c) => c.expert === e).length }));
  const scoreBuckets = [
    { label: "Good", count: scoped.filter((c) => (c.score || "").toLowerCase() === "good").length },
    { label: "Avg", count: scoped.filter((c) => (c.score || "").toLowerCase() === "avg").length },
    { label: "Bad", count: scoped.filter((c) => (c.score || "").toLowerCase() === "bad").length },
    { label: "Unset", count: scoped.filter((c) => !c.score).length },
  ];
  const mockCompletion = {
    mock1Done: scoped.filter((c) => (c.mock1Done || "").toLowerCase() === "yes").length,
    mock2Done: scoped.filter((c) => (c.mock2Done || "").toLowerCase() === "yes").length,
    mock3Done: scoped.filter((c) => (c.mock3Done || "").toLowerCase() === "yes").length,
    total: scoped.length,
  };
  const resumeStatusCounts = {
    done: scoped.filter((c) => (c.resumeStatus || "").toLowerCase() === "done").length,
    pending: scoped.filter((c) => (c.resumeStatus || "").toLowerCase() === "pending").length,
  };
  const avg = (field: "communication" | "technicalKnowledge" | "coding") => {
    const nums = scoped.map((c) => Number(c[field])).filter((n) => Number.isFinite(n) && n > 0);
    return nums.length ? Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2)) : 0;
  };
  const ratings = { communication: avg("communication"), technicalKnowledge: avg("technicalKnowledge"), coding: avg("coding") };
  return NextResponse.json({ me, experts, perExpert, scoreBuckets, mockCompletion, resumeStatusCounts, ratings, total: scoped.length, rows: scoped.map(toRow) });
}
