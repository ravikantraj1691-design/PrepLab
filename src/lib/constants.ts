// Shared constants for the Mock Tracker app.

export const EXPERT_OPTIONS = [
  "hridhya.kk@silverspaceinc.com",
  "mokarram.shahban@vizvainc.com",
  "ritwik.ghosh@vizvainc.com",
  "prince.kumar@vizvainc.com",
  "shraavana@silverspaceinc.com",
] as const;

export const TEAM_LEAD_OPTIONS = ["Ravikant Raj"] as const;

export const RESUME_STATUS_OPTIONS = ["pending", "done"] as const;

export const YES_NO_OPTIONS = ["No", "Yes"] as const;

export const SCORE_OPTIONS = ["Good", "Avg", "Bad"] as const;

export const RATING_OPTIONS = ["1", "2", "3", "4", "5"] as const;

export function expertShort(email: string): string {
  if (!email) return "";
  const at = email.indexOf("@");
  return at > 0 ? email.slice(0, at) : email;
}

export function scoreColor(score: string | null | undefined): string {
  switch ((score || "").toLowerCase()) {
    case "good":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "avg":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "bad":
      return "bg-rose-100 text-rose-700 border-rose-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

export function ratingColor(rating: string | null | undefined): string {
  const n = Number(rating);
  if (!Number.isFinite(n)) return "bg-slate-100 text-slate-600 border-slate-200";
  if (n >= 4) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (n === 3) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-rose-100 text-rose-700 border-rose-200";
}

export const COLUMN_ORDER = [
  "createdAt",
  "candidateName",
  "expert",
  "teamLead",
  "resumeStatus",
  "updatedAt",
  "mockReportSent",
  "score",
  "communication",
  "technicalKnowledge",
  "coding",
  "mock1Done",
  "mock1Recording",
  "mock1Feedback",
  "mock1NextDate",
  "mock2Done",
  "mock2Recording",
  "mock2Feedback",
  "mock3Done",
  "mock3Recording",
  "reasonNotDone",
  "feedback",
] as const;

export const COLUMN_LABELS: Record<string, string> = {
  createdAt: "Created",
  candidateName: "Candidate",
  expert: "Expert",
  teamLead: "Team Lead",
  resumeStatus: "Resume Status",
  updatedAt: "Updated At",
  mockReportSent: "Mock Report Sent?",
  score: "Score",
  communication: "Communication",
  technicalKnowledge: "Technical Knowledge",
  coding: "Coding",
  mock1Done: "Mock 1",
  mock1Recording: "Mock 1 Recording",
  mock1Feedback: "Feedback after mock",
  mock1NextDate: "Next Mock Date",
  mock2Done: "Mock 2",
  mock2Recording: "Mock 2 Recording",
  mock2Feedback: "Mock 2 Feedback",
  mock3Done: "Mock 3",
  mock3Recording: "Mock 3 Recording",
  reasonNotDone: "Reason (if not done)",
  feedback: "Feedback",
};
