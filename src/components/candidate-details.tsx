"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Pencil, Calendar, User, Mail, FileText, Star, Video, MessageSquare, AlertCircle } from "lucide-react";
import { CandidateRow } from "@/lib/types";
import { scoreColor, ratingColor, expertShort } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/dates";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: CandidateRow | null;
  onEdit: (candidate: CandidateRow) => void;
}

export function CandidateDetailsDialog({ open, onOpenChange, candidate, onEdit }: Props) {
  if (!candidate) return null;
  const c = candidate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2 flex-wrap">
            <span>{c.candidateName}</span>
            {c.score && <Badge variant="outline" className={scoreColor(c.score)}>{c.score}</Badge>}
            <Badge
              variant="outline"
              className={c.resumeStatus.toLowerCase() === "done" ? "bg-emerald-100 text-emerald-700 border-emerald-200 capitalize" : "bg-amber-100 text-amber-700 border-amber-200 capitalize"}
            >
              {c.resumeStatus}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Full record for this candidate. Click "Edit" to update any field.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* CORE INFO */}
          <Section icon={User} title="Core information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <DetailRow icon={Mail} label="Expert" value={c.expert} />
              <DetailRow icon={User} label="Team Lead" value={c.teamLead} />
              <DetailRow icon={FileText} label="Mock Report Sent" value={c.mockReportSent} />
              <DetailRow icon={Calendar} label="Created" value={formatDateTime(c.createdAt)} />
              <DetailRow icon={Calendar} label="Updated At" value={formatDateTime(c.updatedAt)} />
            </div>
          </Section>

          {/* SCORES */}
          <Section icon={Star} title="Scores & ratings">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ScoreBox label="Overall Score" value={c.score} color={c.score ? scoreColor(c.score) : ""} />
              <ScoreBox label="Communication" value={c.communication} color={c.communication ? ratingColor(c.communication) : ""} />
              <ScoreBox label="Technical" value={c.technicalKnowledge} color={c.technicalKnowledge ? ratingColor(c.technicalKnowledge) : ""} />
              <ScoreBox label="Coding" value={c.coding} color={c.coding ? ratingColor(c.coding) : ""} />
            </div>
          </Section>

          {/* MOCK ROUNDS */}
          <Section icon={Video} title="Mock interview rounds">
            <div className="space-y-4">
              <MockRoundView
                round="Mock 1"
                done={c.mock1Done}
                recording={c.mock1Recording}
                feedback={c.mock1Feedback}
                nextDate={c.mock1NextDate}
              />
              <MockRoundView
                round="Mock 2"
                done={c.mock2Done}
                recording={c.mock2Recording}
                feedback={c.mock2Feedback}
                nextDate={c.mock2NextDate}
                delayReason={c.mock2DelayReason}
              />
              <MockRoundView
                round="Mock 3"
                done={c.mock3Done}
                recording={c.mock3Recording}
                feedback={c.mock3Feedback}
                nextDate={c.mock3NextDate}
                delayReason={c.mock3DelayReason}
              />
            </div>
          </Section>

          {/* NOTES */}
          {(c.reasonNotDone || c.feedback) && (
            <Section icon={MessageSquare} title="Notes & feedback">
              {c.reasonNotDone && (
                <DetailRow
                  icon={AlertCircle}
                  label="Reason (if not done)"
                  value={c.reasonNotDone}
                  fullWidth
                />
              )}
              {c.feedback && (
                <div className="mt-3">
                  <DetailRow
                    icon={MessageSquare}
                    label="General feedback"
                    value={c.feedback}
                    fullWidth
                  />
                </div>
              )}
            </Section>
          )}
        </div>

        <Separator />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={() => {
            onOpenChange(false);
            onEdit(c);
          }}>
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-400" />
        {title}
      </h3>
      <div className="rounded-lg border border-slate-200 bg-slate-50/40 p-4">
        {children}
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  fullWidth,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
  fullWidth?: boolean;
}) {
  const display = value && String(value).trim() !== "" ? String(value) : null;
  return (
    <div className={fullWidth ? "space-y-1" : "space-y-1"}>
      <div className="text-[11px] uppercase tracking-wide text-slate-400 flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className={`text-sm ${display ? "text-slate-800" : "text-slate-300 italic"}`}>
        {display || "—"}
      </div>
    </div>
  );
}

function ScoreBox({ label, value, color }: { label: string; value: string | null | undefined; color: string }) {
  const display = value && String(value).trim() !== "" ? String(value) : null;
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 text-center">
      <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">{label}</div>
      {display ? (
        <Badge variant="outline" className={`text-base font-semibold ${color}`}>{display}</Badge>
      ) : (
        <span className="text-slate-300 text-base">—</span>
      )}
    </div>
  );
}

function MockRoundView({
  round,
  done,
  recording,
  feedback,
  nextDate,
  delayReason,
}: {
  round: string;
  done: string | null;
  recording: string | null;
  feedback: string | null;
  nextDate: string | null;
  delayReason?: string | null;
}) {
  const isDone = (done || "").toLowerCase() === "yes";
  const hasDelay = !!delayReason && delayReason.trim() !== "";
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-700">{round}</h4>
        {done ? (
          <Badge variant="outline" className={isDone ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}>
            {isDone ? "Done" : "Not done"}
          </Badge>
        ) : (
          <span className="text-xs text-slate-400">Not set</span>
        )}
      </div>
      {(recording || feedback || nextDate) ? (
        <div className="space-y-2 pt-1">
          {recording && (
            <div className="space-y-0.5">
              <div className="text-[11px] uppercase tracking-wide text-slate-400 flex items-center gap-1">
                <Video className="h-3 w-3" /> Recording / Recap
              </div>
              <div className="text-xs text-slate-700 break-all whitespace-pre-wrap">{recording}</div>
            </div>
          )}
          {feedback && (
            <div className="space-y-0.5">
              <div className="text-[11px] uppercase tracking-wide text-slate-400 flex items-center gap-1">
                <MessageSquare className="h-3 w-3" /> Feedback
              </div>
              <div className="text-xs text-slate-700 whitespace-pre-wrap">{feedback}</div>
            </div>
          )}
          {nextDate && (
            <div className="space-y-0.5">
              <div className="text-[11px] uppercase tracking-wide text-slate-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Next mock date
              </div>
              <div className="text-xs text-slate-700">{formatDate(nextDate)}</div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic pt-1">No details recorded for this round.</p>
      )}
      {/* Delay reason — shown when the round is not done and a reason was recorded. */}
      {hasDelay && (
        <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 space-y-0.5">
          <div className="text-[11px] uppercase tracking-wide text-amber-700 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Why this mock hasn&apos;t happened
          </div>
          <div className="text-xs text-amber-900 whitespace-pre-wrap">{delayReason}</div>
        </div>
      )}
    </div>
  );
}
