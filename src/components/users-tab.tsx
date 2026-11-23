"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Pencil, Plus, Trash2, UserCog, Shield, RefreshCw } from "lucide-react";

interface User {
  id: string;
  email: string;
  role: "admin" | "expert";
  expertEmail: string | null;
  createdAt?: string;
}

interface Props {
  /// The current admin user (used to prevent self-deletion in the UI).
  currentUserId: string;
  expertsFromDb: string[];
  onUsersChanged?: () => void;
}

export function UsersTab({ currentUserId, expertsFromDb, onUsersChanged }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/users");
      if (!resp.ok) {
        const d = await resp.json();
        throw new Error(d.error || "Failed to load users");
      }
      const data = await resp.json();
      setUsers(data.users || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleSaved = () => {
    refresh();
    onUsersChanged?.();
  };
  const handleDeleted = () => {
    refresh();
    onUsersChanged?.();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const resp = await fetch(`/api/users/${deleteTarget.id}`, { method: "DELETE" });
      const d = await resp.json();
      if (!resp.ok) throw new Error(d.error || "Delete failed");
      handleDeleted();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-violet-600" />
            User Management
          </CardTitle>
          <CardDescription>
            Admins have full access to all candidates, settings, and sync. Experts can only edit
            candidates assigned to their expert email — they cannot add, delete, or sync.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">
              {users.length} user{users.length === 1 ? "" : "s"} total ·{" "}
              {users.filter((u) => u.role === "admin").length} admin ·{" "}
              {users.filter((u) => u.role === "expert").length} expert
            </div>
            <Button
              onClick={() => {
                setEditing(null);
                setEditOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add user
            </Button>
          </div>

          {error && (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded p-2">
              {error}{" "}
              <button className="underline" onClick={refresh}>Retry</button>
            </div>
          )}

          <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expert Email (scope)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-400 py-8">Loading…</TableCell>
                  </TableRow>
                )}
                {!loading && users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-400 py-8">No users yet.</TableCell>
                  </TableRow>
                )}
                {!loading && users.map((u) => (
                  <TableRow key={u.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium text-slate-800">
                      {u.email}
                      {u.id === currentUserId && (
                        <Badge variant="outline" className="ml-2 bg-sky-50 text-sky-700 border-sky-200">you</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.role === "admin" ? (
                        <Badge variant="outline" className="bg-violet-100 text-violet-700 border-violet-200">
                          <Shield className="h-3 w-3 mr-1" />admin
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">expert</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">{u.expertEmail || <span className="text-slate-400">— (all candidates)</span>}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button variant="ghost" size="sm" onClick={() => { setEditing(u); setEditOpen(true); }} title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(u)}
                        disabled={u.id === currentUserId}
                        title={u.id === currentUserId ? "You cannot delete your own account" : "Delete"}
                        className="text-rose-600 hover:text-rose-700 disabled:text-slate-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <UserEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={editing}
        expertsFromDb={expertsFromDb}
        onSaved={handleSaved}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete user?</DialogTitle>
            <DialogDescription>
              This will permanently remove <strong>{deleteTarget?.email}</strong> ({deleteTarget?.role}).
              They will no longer be able to log in. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete user</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface EditProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: User | null;
  expertsFromDb: string[];
  onSaved: () => void;
}

function UserEditDialog({ open, onOpenChange, initial, expertsFromDb, onSaved }: EditProps) {
  const isEdit = !!initial;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "expert">("expert");
  const [expertEmail, setExpertEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setEmail(initial?.email || "");
      setPassword("");
      setRole(initial?.role || "expert");
      setExpertEmail(initial?.expertEmail || "");
      setError(null);
    }
  }, [open, initial]);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      if (isEdit && initial) {
        // For edits, only send fields the user actually filled in.
        const body: Record<string, unknown> = {};
        if (email.trim() && email.trim().toLowerCase() !== initial.email) body.email = email.trim().toLowerCase();
        if (password) body.password = password;
        if (role !== initial.role) body.role = role;
        if (role === "expert" && expertEmail && expertEmail !== initial.expertEmail) body.expertEmail = expertEmail;
        if (Object.keys(body).length === 0) {
          onOpenChange(false);
          return;
        }
        const resp = await fetch(`/api/users/${initial.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const d = await resp.json();
        if (!resp.ok) throw new Error(d.error || "Update failed");
        onSaved();
        onOpenChange(false);
      } else {
        // New user — all fields required.
        if (!email.trim() || !password) throw new Error("Email and password are required");
        if (role === "expert" && !expertEmail) throw new Error("Expert users need an expert email");
        const resp = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase(), password, role, expertEmail: role === "expert" ? expertEmail : null }),
        });
        const d = await resp.json();
        if (!resp.ok) throw new Error(d.error || "Create failed");
        onSaved();
        onOpenChange(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit — ${initial?.email}` : "Add new user"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Leave the password blank to keep the existing one. Experts can only edit candidates whose expert email matches their scope."
              : "Create a new login. Choose a strong password — the user can change it later."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">
              Password {isEdit ? "(leave blank to keep current)" : "*"}
            </Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "admin" | "expert")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">admin — full access to all candidates, settings, sync</SelectItem>
                <SelectItem value="expert">expert — edit only their own candidates</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {role === "expert" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">Expert email (scope) *</Label>
              <SelectOrExpertEmail value={expertEmail} onChange={setExpertEmail} options={expertsFromDb} />
              <p className="text-[11px] text-slate-500">
                This user will only see candidates whose &quot;Expert&quot; field matches this email.
              </p>
            </div>
          )}
          {error && (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded p-2">{error}</div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : null}
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add user"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SelectOrExpertEmail({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  const [mode, setMode] = useState<"select" | "text">(() => (value && !options.includes(value) ? "text" : "select"));
  if (mode === "select") {
    return (
      <div className="flex gap-2">
        <Select value={value || "__none__"} onValueChange={(v) => onChange(v === "__none__" ? "" : v)}>
          <SelectTrigger className="flex-1"><SelectValue placeholder="Pick an expert email" /></SelectTrigger>
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
      <Input className="flex-1" value={value} onChange={(e) => onChange(e.target.value)} placeholder="expert@vizvainc.com" />
      <Button type="button" variant="outline" size="sm" onClick={() => setMode("select")}>Pick</Button>
    </div>
  );
}
