"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, Plus, Search, Trash2, ArrowUp, ArrowDown, Eye, AlertTriangle } from "lucide-react";
import { CandidateRow } from "@/lib/types";
import { scoreColor, ratingColor, expertShort } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/dates";
import { CandidateFormDialog } from "./candidate-form";
import { CandidateDetailsDialog } from "./candidate-details";
import { MockDelayDialog, getPendingMockRound, daysOverdue } from "./mock-delay-dialog";

interface Props {
  rows: CandidateRow[];
  loading: boolean;
  expertsFromDb: string[];
  /// "admin" = full add/edit/delete; "expert" = edit own only (no add, no delete).
  userRole: "admin" | "expert";
  onSaved: (row: CandidateRow) => void;
  onDeleted: (id: string) => void;
  onRefresh: () => void;
}

type SortKey = "candidateName" | "createdAt" | "updatedAt" | "expert" | "score";

export function TrackerTab({ rows, loading, expertsFromDb, userRole, onSaved, onDeleted, onRefresh }: Props) {
  const canAdd = userRole === "admin";
  const canDelete = userRole === "admin";
  const [search, setSearch] = useState("");
  const [expertFilter, setExpertFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CandidateRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CandidateRow | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<CandidateRow | null>(null);
  const [delayTarget, setDelayTarget] = useState<CandidateRow | null>(null);

  // Auto-open the delay dialog for the most overdue pending mock when the
  // expert first lands on the tracker. Only fires once per load.
  const autoOpenedRef = useRef(false);
  useEffect(() => {
    if (autoOpenedRef.current) return;
    if (loading) return;
    if (rows.length === 0) return;
    autoOpenedRef.current = true;
    // Find candidates with a pending mock round, sorted by most overdue first.
    const pending = rows
      .map((r) => ({ r, round: getPendingMockRound(r), overdue: daysOverdue(r, getPendingMockRound(r) ?? 2) }))
      .filter((x) => x.round !== null)
      .sort((a, b) => b.overdue - a.overdue);
    if (pending.length > 0 && pending[0].overdue >= 0) {
      setDelayTarget(pending[0].r);
    }
  }, [loading, rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = rows.filter((r) => {
      if (q) {
        const hay = [r.candidateName, r.expert, r.teamLead, r.mock1Recording, r.mock2Recording, r.mock3Recording, r.feedback]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (expertFilter !== "all" && r.expert !== expertFilter) return false;
      if (scoreFilter !== "all" && (r.score || "").toLowerCase() !== scoreFilter) return false;
      if (statusFilter !== "all" && r.resumeStatus.toLowerCase() !== statusFilter) return false;
      return true;
    });
    list.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const av = (a[sortKey] || "").toString().toLowerCase();
      const bv = (b[sortKey] || "").toString().toLowerCase();
      if (sortKey === "createdAt" || sortKey === "updatedAt") {
        const ad = a[sortKey] ? new Date(a[sortKey] as string).getTime() : 0;
        const bd = b[sortKey] ? new Date(b[sortKey] as string).getTime() : 0;
        return (ad - bd) * dir;
      }
      return av.localeCompare(bv) * dir;
    });
    return list;
  }, [rows, search, expertFilter, scoreFilter, statusFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleEdit = (r: CandidateRow) => {
    setEditing(r);
    setFormOpen(true);
  };
  const handleAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const handleViewDetails = (r: CandidateRow) => {
    setDetailsTarget(r);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const resp = await fetch(`/api/candidates/${deleteTarget.id}`, { method: "DELETE" });
      if (!resp.ok) throw new Error("Delete failed");
      onDeleted(deleteTarget.id);
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate, expert, recap, feedback…"
            className="pl-8"
          />
        </div>
        <Select value={expertFilter} onValueChange={setExpertFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Expert" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All experts</SelectItem>
            {expertsFromDb.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={scoreFilter} onValueChange={setScoreFilter}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="Score" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All scores</SelectItem>
            <SelectItem value="good">Good</SelectItem>
            <SelectItem value="avg">Avg</SelectItem>
            <SelectItem value="bad">Bad</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        {canAdd && (
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" /> Add candidate
          </Button>
        )}
      </div>

      {/* Result count */}
      <div className="text-sm text-slate-500">
        Showing <strong className="text-slate-700">{filtered.length}</strong> of {rows.length} candidates
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
        <div className="max-h-[65vh] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-slate-50 z-10">
              <TableRow>
                <TableHead className="w-[40px]">#</TableHead>
                <SortableHead label="Candidate" active={sortKey === "candidateName"} dir={sortDir} onClick={() => toggleSort("candidateName")} />
                <TableHead>Expert</TableHead>
                <SortableHead label="Created" active={sortKey === "createdAt"} dir={sortDir} onClick={() => toggleSort("createdAt")} />
                <SortableHead label="Updated" active={sortKey === "updatedAt"} dir={sortDir} onClick={() => toggleSort("updatedAt")} />
                <TableHead>Resume</TableHead>
                <TableHead>Report</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-center">Com</TableHead>
                <TableHead className="text-center">Tech</TableHead>
                <TableHead className="text-center">Code</TableHead>
                <TableHead className="text-center">M1</TableHead>
                <TableHead className="text-center">M2</TableHead>
                <TableHead className="text-center">M3</TableHead>
                <TableHead className="text-center">Pending</TableHead>
                <TableHead>Next Mock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={17} className="text-center text-slate-400 py-12">Loading…</TableCell>
                </TableRow>
              )}
              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={17} className="text-center text-slate-400 py-12">
                    No candidates match your filters.
                  </TableCell>
                </TableRow>
              )}
              {!loading && filtered.map((r, i) => (
                <TableRow key={r.id} className="hover:bg-slate-50">
                  <TableCell className="text-slate-400 text-xs">{i + 1}</TableCell>
                  <TableCell className="font-medium text-slate-800">
                    <button
                      type="button"
                      onClick={() => handleViewDetails(r)}
                      className="text-left hover:text-sky-700 hover:underline focus:outline-none focus:text-sky-700 focus:underline cursor-pointer"
                      title="View details"
                    >
                      {r.candidateName}
                    </button>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600" title={r.expert}>{expertShort(r.expert)}</TableCell>
                  <TableCell className="text-xs text-slate-500 whitespace-nowrap">{formatDate(r.createdAt)}</TableCell>
                  <TableCell className="text-xs text-slate-500 whitespace-nowrap">{formatDateTime(r.updatedAt)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={r.resumeStatus.toLowerCase() === "done" ? "bg-emerald-100 text-emerald-700 border-emerald-200 capitalize" : "bg-amber-100 text-amber-700 border-amber-200 capitalize"}>
                      {r.resumeStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{r.mockReportSent}</TableCell>
                  <TableCell>
                    {r.score ? <Badge variant="outline" className={scoreColor(r.score)}>{r.score}</Badge> : <span className="text-slate-300">—</span>}
                  </TableCell>
                  <RatingCell v={r.communication} />
                  <RatingCell v={r.technicalKnowledge} />
                  <RatingCell v={r.coding} />
                  <MockDoneCell v={r.mock1Done} />
                  <MockDoneCell v={r.mock2Done} />
                  <MockDoneCell v={r.mock3Done} />
                  <PendingCell row={r} onPrompt={() => setDelayTarget(r)} />
                  <TableCell className="text-xs text-slate-600 whitespace-nowrap">{formatDate(r.mock1NextDate) || "—"}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" onClick={() => handleViewDetails(r)} title="View details">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(r)} title="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {canDelete && (
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(r)} title="Delete" className="text-rose-600 hover:text-rose-700">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <CandidateFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        expertsFromDb={expertsFromDb}
        userRole={userRole}
        onSaved={onSaved}
      />

      {/* Read-only details view — opened by clicking the candidate name or the eye icon */}
      <CandidateDetailsDialog
        open={!!detailsTarget}
        onOpenChange={(o) => !o && setDetailsTarget(null)}
        candidate={detailsTarget}
        onEdit={(r) => {
          setDetailsTarget(null);
          handleEdit(r);
        }}
      />

      {/* Pending-mock delay reason popup — auto-opens for experts on load, or when the
          pending indicator in the table is clicked. */}
      <MockDelayDialog
        open={!!delayTarget}
        onOpenChange={(o) => !o && setDelayTarget(null)}
        candidate={delayTarget}
        onSaved={onSaved}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete candidate?</DialogTitle>
            <DialogDescription>
              This will permanently remove <strong>{deleteTarget?.candidateName}</strong> from the tracker.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SortableHead({ label, active, dir, onClick }: { label: string; active: boolean; dir: "asc" | "desc"; onClick: () => void }) {
  return (
    <TableHead>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 ${active ? "text-slate-900 font-semibold" : "text-slate-600 font-medium"} hover:text-slate-900`}
      >
        {label}
        {active && (dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </TableHead>
  );
}

function RatingCell({ v }: { v: string | null }) {
  if (!v) return <TableCell className="text-center text-slate-300">—</TableCell>;
  return (
    <TableCell className="text-center">
      <Badge variant="outline" className={ratingColor(v)}>{v}</Badge>
    </TableCell>
  );
}

function MockDoneCell({ v }: { v: string | null }) {
  const isYes = (v || "").toLowerCase() === "yes";
  return (
    <TableCell className="text-center">
      {v ? (
        <Badge variant="outline" className={isYes ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}>
          {isYes ? "✓" : "No"}
        </Badge>
      ) : (
        <span className="text-slate-300">—</span>
      )}
    </TableCell>
  );
}

/// Cell that shows a clickable "!" indicator when a mock round is pending
/// (mock 1 done but mock 2 not done → pending 2; mock 2 done but mock 3 not done → pending 3).
/// Clicking opens the MockDelayDialog so the expert can record why the mock hasn't happened.
function PendingCell({ row, onPrompt }: { row: CandidateRow; onPrompt: () => void }) {
  const round = getPendingMockRound(row);
  if (!round) {
    return <TableCell className="text-center text-slate-300">—</TableCell>;
  }
  const overdue = daysOverdue(row, round);
  const tone =
    overdue > 7 ? "bg-rose-100 text-rose-700 border-rose-300 hover:bg-rose-200"
    : overdue > 0 ? "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200"
    : "bg-sky-100 text-sky-700 border-sky-300 hover:bg-sky-200";
  const title =
    overdue > 0 ? `Mock ${round} pending — ${overdue} day${overdue === 1 ? "" : "s"} overdue. Click to record reason.`
    : `Mock ${round} pending. Click to record reason.`;
  return (
    <TableCell className="text-center">
      <button
        type="button"
        onClick={onPrompt}
        title={title}
        className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium transition-colors ${tone}`}
      >
        <AlertTriangle className="h-3 w-3" />
        M{round}
      </button>
    </TableCell>
  );
}
