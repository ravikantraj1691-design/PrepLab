"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { CandidateRow } from "@/lib/types";
import { formatDate, toDisplayDate } from "@/lib/dates";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: CandidateRow | null;
  onSaved: (row: CandidateRow) => void;
}

export function getPendingMockRound(r: CandidateRow | null): 2 | 3 | null {
  if (!r) return null;
  const isYes = (v: string | null | undefined) => (v || "").toLowerCase() === "yes";
  const mock1Done = isYes(r.mock1Done);
  const mock2Done = isYes(r.mock2Done);
  const mock3Done = isYes(r.mock3Done);
  if (mock1Done && !mock2Done) return 2;
  if (mock2Done && !mock3Done) return 3;
  return null;
}

export function daysOverdue(r: CandidateRow, pendingRound: 2 | 3): number {
  const expectedIso = pendingRound === 2 ? r.mock1NextDate : r.mock2NextDate;
  if (!expectedIso) return 0;
  const expected = new Date(expectedIso);
  if (Number.isNaN(expected.getTime())) return 0;
  const today = new Date();
  const ms = today.getTime() - expected.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

export function MockDelayDialog({ open, onOpenChange, candidate, onSaved }: Props) {
  const pendingRound = useMemo(() => getPendingMockRound(candidate), [candidate]);
  const overdue = candidate && pendingRound ? daysOverdue(candidate, pendingRound) : 0;
  const expectedIso = pendingRound === 2 ? candidate?.mock1NextDate : candidate?.mock3NextDate;

  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!candidate || !pendingRound) return;
    const existing = pendingRound === 2 ? candidate.mock2DelayReason : candidate.mock3DelayReason;
    setReason(existing || "");
    setError(null);
  }, [candidate, pendingRound, open]);

  if (!candidate || !pendingRound) return null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const field = pendingRound === 2 ? "mock2DelayReason" : "mock3DelayReason";
      const resp = await fetch(`/api/candidates/${candidate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: reason }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => null);
        throw new Error(body?.error || `Save failed (${resp.status})`);
      }
      const { row } = await resp.json();
      onSaved(row);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const overdueLabel =
    overdue > 0 ? `${overdue} day${overdue === 1 ? "" : "s"} overdue`
    : overdue === 0 ? "Due today"
    : `${Math.abs(overdue)} day${overdue === -1 ? "" : "s"} remaining`;

  const overdueColor =
    overdue > 7 ? "text-rose-600 bg-rose-50 border-rose-200"
    : overdue > 0 ? "text-amber-600 bg-amber-50 border-amber-200"
    : "text-emerald-600 bg-emerald-50 border-emerald-200";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <DialogTitle className="text-base">
                Mock {pendingRound} pending for {candidate.candidateName}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Please record why this mock hasn&apos;t happened yet.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              Mock {pendingRound - 1} done
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3 text-amber-600" />
              Mock {pendingRound} not done
            </Badge>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                Expected mock {pendingRound} date
              </span>
              <span className="font-medium text-slate-800">
                {expectedIso ? formatDate(expectedIso) : toDisplayDate(null) || "Not set"}
              </span>
            </div>
            <div className={`text-xs px-2 py-1 rounded-md border inline-flex items-center gap-1 ${overdueColor}`}>
              <AlertTriangle className="h-3 w-3" />
              {overdueLabel}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="mock-delay-reason" className="text-sm font-medium text-slate-700">
              Reason mock {pendingRound} has not been taken yet
            </label>
            <Textarea
              id="mock-delay-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Candidate is on personal leave until 15 Dec; will schedule mock 2 on return."
              rows={4}
              className="resize-y"
            />
            <p className="text-xs text-slate-500">
              This reason is saved to the candidate record and visible to admins in the details view.
            </p>
          </div>

          {error && (
            <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Save reason
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
