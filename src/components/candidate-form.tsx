"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CandidateRow, CandidateInput } from "@/lib/types";
import {
  EXPERT_OPTIONS,
  TEAM_LEAD_OPTIONS,
  RESUME_STATUS_OPTIONS,
  YES_NO_OPTIONS,
  SCORE_OPTIONS,
  RATING_OPTIONS,
} from "@/lib/constants";
import { toDisplayDateTime, toDisplayDate, parseFlexibleDate, formatDateTime } from "@/lib/dates";

const emptyInput: CandidateInput = {
  candidateName: "",
  expert: "",
  teamLead: "Ravikant Raj",
  resumeStatus: "pending",
  mockReportSent: "No",
  // Store as a display-format string ("M/D/YYYY h:mm AM/PM") so the plain-text
  // input shows a familiar value; the API re-parses it on save.
  createdAt: toDisplayDateTime(new Date().toISOString()),
  updatedAt: toDisplayDateTime(new Date().toISOString()),
  score: null,
  communication: null,
  technicalKnowledge: null,
  coding: null,
  mock1Done: null,
  mock1Recording: null,
  mock1Feedback: null,
  mock1NextDate: null,
  mock2Done: null,
  mock2Recording: null,
  mock2Feedback: null,
  mock3Done: null,
  mock3Recording: null,
  mock3Feedback: null,
  reasonNotDone: null,
  feedback: null,
};

function rowToInput(row: CandidateRow): CandidateInput {
  const { id: _id, ...rest } = row;
  return {
    ...rest,
    // Convert ISO dates to display format so the plain-text inputs show a
    // familiar value the user can read and edit.
    createdAt: row.createdAt ? toDisplayDateTime(row.createdAt) : null,
    updatedAt: row.updatedAt ? toDisplayDateTime(row.updatedAt) : null,
    mock1NextDate: row.mock1NextDate ? toDisplayDate(row.mock1NextDate) : null,
    mock2NextDate: row.mock2NextDate ? toDisplayDate(row.mock2NextDate) : null,
    mock3NextDate: row.mock3NextDate ? toDisplayDate(row.mock3NextDate) : null,
  };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If provided, the dialog is in "edit" mode; otherwise "add" mode. */
  initial?: CandidateRow | null;
  expertsFromDb?: string[];
  /// "admin" can edit the Expert field; "expert" cannot reassign (read-only display).
  userRole?: "admin" | "expert";
  onSaved: (row: CandidateRow) => void;
}

export function CandidateFormDialog({ open, onOpenChange, initial, expertsFromDb = [], userRole = "admin", onSaved }: Props) {
  const [input, setInput] = useState<CandidateInput>(emptyInput);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!initial;

  useEffect(() => {
    if (open) {
      setInput(
        initial
          ? rowToInput(initial)
          : {
              ...emptyInput,
              createdAt: toDisplayDateTime(new Date().toISOString()),
              updatedAt: toDisplayDateTime(new Date().toISOString()),
            }
      );
      setError(null);
    }
  }, [open, initial]);

  // Combine canonical expert list with any extra experts observed in the DB.
  const experts = Array.from(new Set([...EXPERT_OPTIONS, ...expertsFromDb])).sort();

  const set = <K extends keyof CandidateInput>(key: K, value: CandidateInput[K]) => {
    setInput((cur) => ({ ...cur, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    if (!input.candidateName.trim()) {
      setError("Candidate name is required.");
      setSaving(false);
      return;
    }
    if (!input.expert.trim()) {
      setError("Expert is required.");
      setSaving(false);
      return;
    }
    try {
      // Always refresh "updatedAt" on save.
      const payload = { ...input, updatedAt: new Date().toISOString() };
      const url = isEdit && initial ? `/api/candidates/${initial.id}` : "/api/candidates";
      const method = isEdit ? "PUT" : "POST";
      const resp = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Save failed (${resp.status}): ${txt.slice(0, 200)}`);
      }
      const data = await resp.json();
      onSaved(data.row as CandidateRow);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit — ${initial?.candidateName}` : "Add new candidate"}</DialogTitle>
          <DialogDescription>
            Fill in the fields below. Mock rounds are optional — add them as the candidate progresses.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="core" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="core">Core</TabsTrigger>
            <TabsTrigger value="scores">Scores</TabsTrigger>
            <TabsTrigger value="mocks">Mock rounds</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          {/* CORE */}
          <TabsContent value="core" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Candidate name *">
                <Input value={input.candidateName} onChange={(e) => set("candidateName", e.target.value)} placeholder="e.g. Sowmya Kethavath" />
              </Field>
              <Field label="Expert *">
                {userRole === "admin" ? (
                  <SelectOrText value={input.expert} onChange={(v) => set("expert", v)} options={experts} placeholder="Select or type an email" />
                ) : (
                  <Input value={input.expert} readOnly disabled placeholder="—" className="bg-slate-50 text-slate-500" />
                )}
              </Field>
              <Field label="Team Lead">
                <SelectOrText value={input.teamLead} onChange={(v) => set("teamLead", v)} options={[...TEAM_LEAD_OPTIONS]} />
              </Field>
              <Field label="Resume Status">
                <Select value={input.resumeStatus} onValueChange={(v) => set("resumeStatus", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RESUME_STATUS_OPTIONS.map((o) => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Mock Report Sent?">
                <Select value={input.mockReportSent} onValueChange={(v) => set("mockReportSent", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {YES_NO_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <DateTextInput
                label="Created"
                value={input.createdAt}
                onChange={(v) => set("createdAt", v)}
                placeholder="e.g. 10/27/2026 06:40 PM"
                showTime
              />
              <DateTextInput
                label="Updated At"
                value={input.updatedAt}
                onChange={(v) => set("updatedAt", v)}
                placeholder="e.g. 10/27/2026 06:40 PM"
                showTime
              />
            </div>
          </TabsContent>

          {/* SCORES */}
          <TabsContent value="scores" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Overall Score">
                <Select value={input.score || "__none__"} onValueChange={(v) => set("score", v === "__none__" ? null : v)}>
                  <SelectTrigger><SelectValue placeholder="Not set" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Not set —</SelectItem>
                    {SCORE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Communication (1-5)">
                <Select value={input.communication || "__none__"} onValueChange={(v) => set("communication", v === "__none__" ? null : v)}>
                  <SelectTrigger><SelectValue placeholder="Not set" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Not set —</SelectItem>
                    {RATING_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Technical Knowledge (1-5)">
                <Select value={input.technicalKnowledge || "__none__"} onValueChange={(v) => set("technicalKnowledge", v === "__none__" ? null : v)}>
                  <SelectTrigger><SelectValue placeholder="Not set" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Not set —</SelectItem>
                    {RATING_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Coding (1-5)">
                <Select value={input.coding || "__none__"} onValueChange={(v) => set("coding", v === "__none__" ? null : v)}>
                  <SelectTrigger><SelectValue placeholder="Not set" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Not set —</SelectItem>
                    {RATING_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </TabsContent>

          {/* MOCKS */}
          <TabsContent value="mocks" className="space-y-6 mt-4">
            <MockRoundTab
              label="Mock 1"
              done={input.mock1Done}
              recording={input.mock1Recording}
              feedback={input.mock1Feedback}
              nextDate={input.mock1NextDate}
              onDone={(v) => set("mock1Done", v)}
              onRecording={(v) => set("mock1Recording", v)}
              onFeedback={(v) => set("mock1Feedback", v)}
              onNextDate={(v) => set("mock1NextDate", v)}
            />
            <MockRoundTab
              label="Mock 2"
              done={input.mock2Done}
              recording={input.mock2Recording}
              feedback={input.mock2Feedback}
              nextDate={input.mock2NextDate}
              onDone={(v) => set("mock2Done", v)}
              onRecording={(v) => set("mock2Recording", v)}
              onFeedback={(v) => set("mock2Feedback", v)}
              onNextDate={(v) => set("mock2NextDate", v)}
            />
            <MockRoundTab
              label="Mock 3"
              done={input.mock3Done}
              recording={input.mock3Recording}
              feedback={input.mock3Feedback}
              nextDate={input.mock3NextDate}
              onDone={(v) => set("mock3Done", v)}
              onRecording={(v) => set("mock3Recording", v)}
              onFeedback={(v) => set("mock3Feedback", v)}
              onNextDate={(v) => set("mock3NextDate", v)}
            />
          </TabsContent>

          {/* NOTES */}
          <TabsContent value="notes" className="space-y-4 mt-4">
            <Field label="Reason (if not done)">
              <Textarea value={input.reasonNotDone || ""} onChange={(e) => set("reasonNotDone", e.target.value)} rows={2} placeholder="e.g. Candidate refused to take the mock" />
            </Field>
            <Field label="General Feedback">
              <Textarea value={input.feedback || ""} onChange={(e) => set("feedback", e.target.value)} rows={4} placeholder="Overall feedback on the candidate" />
            </Field>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded p-2">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add candidate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-slate-600">{label}</Label>
      {children}
    </div>
  );
}

/// A combobox-like control: a select dropdown that also lets the user type a custom value.
/// The Radix Dialog remounts its content each time it opens, so the lazy initializer
/// below runs fresh with the latest `value` whenever the dialog is opened.
function SelectOrText({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  const [mode, setMode] = useState<"select" | "text">(() => (value && !options.includes(value) ? "text" : "select"));

  if (mode === "select") {
    return (
      <div className="flex gap-2">
        <Select value={value || "__none__"} onValueChange={(v) => onChange(v === "__none__" ? "" : v)}>
          <SelectTrigger className="flex-1"><SelectValue placeholder={placeholder || "Select"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— None —</SelectItem>
            {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="sm" onClick={() => setMode("text")}>Custom</Button>
      </div>
    );
  }
  return (
    <div className="flex gap-2">
      <Input className="flex-1" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      <Button type="button" variant="outline" size="sm" onClick={() => setMode("select")}>Pick</Button>
    </div>
  );
}

interface MockRoundProps {
  label: string;
  done: string | null;
  recording: string | null;
  feedback: string | null;
  nextDate: string | null;
  onDone: (v: string | null) => void;
  onRecording: (v: string | null) => void;
  onFeedback: (v: string | null) => void;
  onNextDate: (v: string | null) => void;
}

function MockRoundTab({ label, done, recording, feedback, nextDate, onDone, onRecording, onFeedback, onNextDate }: MockRoundProps) {
  return (
    <div className="rounded-lg border border-slate-200 p-4 space-y-3 bg-slate-50/40">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-700">{label}</h4>
        <Select value={done || "__none__"} onValueChange={(v) => onDone(v === "__none__" ? null : v)}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Not set" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— Not set —</SelectItem>
            {YES_NO_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o === "Yes" ? "Done" : "Not done"}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Field label="Recording / Recap (meeting title, link, type, platform)">
        <Textarea value={recording || ""} onChange={(e) => onRecording(e.target.value)} rows={2} placeholder="e.g. Recap: Mock Interview - Sowmya Kethavath Thursday, October 8 | Meeting | Microsoft Teams" />
      </Field>
      <Field label="Feedback after this mock">
        <Textarea value={feedback || ""} onChange={(e) => onFeedback(e.target.value)} rows={2} placeholder="Notes from this mock round" />
      </Field>
      <DateTextInput
        label="Date for next mock report"
        value={nextDate}
        onChange={onNextDate}
        placeholder="e.g. 10/27/2026"
        showTime={false}
      />
    </div>
  );
}

/// A plain-text date input that accepts pasted values in many formats and shows
/// a live preview of the parsed result so the user knows the value will be
/// stored correctly. No calendar picker — just type or paste.
///
/// Accepts: "10/27/2026", "10/27/2026 06:40 PM", "10/27/2026 18:40:30",
/// "2026-10-27", "2026-10-27T18:40", "Oct 27, 2026 6:40 PM", Excel serials,
/// and any string Date() can parse.
function DateTextInput({
  label,
  value,
  onChange,
  placeholder,
  showTime,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
  showTime: boolean;
}) {
  const parsed = parseFlexibleDate(value);
  const preview = parsed ? formatDateTime(parsed) : null;
  const hasValue = !!value && value.trim() !== "";
  const isValid = !hasValue || preview !== null;

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-slate-600">{label}</Label>
      <Input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
        placeholder={placeholder}
        className={!isValid ? "border-rose-300 focus-visible:ring-rose-300" : "font-mono text-sm"}
      />
      {hasValue && (
        <p className={`text-[11px] leading-tight ${isValid ? "text-emerald-600" : "text-rose-600"}`}>
          {isValid ? (
            <>Will save as: <span className="font-mono">{preview}</span>{showTime ? "" : " (date only)"}</>
          ) : (
            <>Unrecognized format — try "10/27/2026 06:40 PM" or "2026-10-27"</>
          )}
        </p>
      )}
    </div>
  );
}

