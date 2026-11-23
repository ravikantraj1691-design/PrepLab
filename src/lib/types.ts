export interface CandidateRow {
  id: string;
  candidateName: string;
  expert: string;
  teamLead: string;
  resumeStatus: string;
  mockReportSent: string;
  createdAt: string | null;
  updatedAt: string | null;
  score: string | null;
  communication: string | null;
  technicalKnowledge: string | null;
  coding: string | null;
  mock1Done: string | null;
  mock1Recording: string | null;
  mock1Feedback: string | null;
  mock1NextDate: string | null;
  mock2Done: string | null;
  mock2Recording: string | null;
  mock2Feedback: string | null;
  mock2NextDate: string | null;
  mock2DelayReason: string | null;
  mock3Done: string | null;
  mock3Recording: string | null;
  mock3Feedback: string | null;
  mock3NextDate: string | null;
  mock3DelayReason: string | null;
  reasonNotDone: string | null;
  feedback: string | null;
}

export type CandidateInput = Omit<CandidateRow, "id">;
