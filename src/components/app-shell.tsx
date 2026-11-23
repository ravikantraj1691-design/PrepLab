"use client";

import { useCallback, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, LayoutDashboard, ListChecks, LogOut, Settings, Shield, UserCog, Users, BookOpen } from "lucide-react";
import { CandidateRow } from "@/lib/types";
import { TrackerTab } from "@/components/tracker-tab";
import { DashboardTab } from "@/components/dashboard-tab";
import { SettingsTab } from "@/components/settings-tab";
import { UsersTab } from "@/components/users-tab";
import { SopGuideTab } from "@/components/sop-guide-tab";

export interface AppUser {
  id: string;
  email: string;
  role: "admin" | "expert";
  expertEmail: string | null;
}

interface DropdownsResp {
  experts: string[];
  rows: CandidateRow[];
}

interface Props {
  user: AppUser;
}

export function AppShell({ user }: Props) {
  const isAdmin = user.role === "admin";
  const [tab, setTab] = useState("tracker");
  const [rows, setRows] = useState<CandidateRow[]>([]);
  const [experts, setExperts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/dropdowns");
      if (resp.status === 401) {
        window.location.reload();
        return;
      }
      if (!resp.ok) throw new Error(`Failed to load: ${resp.status}`);
      const data: DropdownsResp = await resp.json();
      setExperts(data.experts || []);
      setRows(data.rows || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSaved = useCallback((row: CandidateRow) => {
    setRows((cur) => {
      const idx = cur.findIndex((r) => r.id === row.id);
      if (idx >= 0) {
        const copy = [...cur];
        copy[idx] = row;
        return copy;
      }
      return [row, ...cur];
    });
    setExperts((cur) => Array.from(new Set([...cur, row.expert])).sort());
  }, []);

  const handleDeleted = useCallback((id: string) => {
    setRows((cur) => cur.filter((r) => r.id !== id));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.reload();
    }
  };

  const tabs = isAdmin
    ? [
        { value: "tracker", label: "Tracker", icon: ListChecks },
        { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { value: "sop", label: "SOP Guide", icon: BookOpen },
        { value: "users", label: "Users", icon: UserCog },
        { value: "settings", label: "Settings", icon: Settings },
      ]
    : [
        { value: "tracker", label: "Tracker", icon: ListChecks },
        { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { value: "sop", label: "SOP Guide", icon: BookOpen },
      ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 leading-tight">Mock Tracker</h1>
              <p className="text-xs text-slate-500 leading-tight">
                {isAdmin
                  ? "Admin view — full access to all candidates"
                  : `Expert view — showing only your candidates (${user.expertEmail || "?"})`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white">
              <Database className="h-3 w-3 mr-1" />
              {rows.length} {rows.length === 1 ? "row" : "rows"}
            </Badge>
            <Badge
              variant="outline"
              className="bg-white gap-1.5 py-1 px-2 font-normal"
              title={isAdmin ? "Admin — full access" : `Expert — scope: ${user.expertEmail || "?"}`}
            >
              {isAdmin
                ? <Shield className="h-3.5 w-3.5 text-violet-600" />
                : <Users className="h-3.5 w-3.5 text-slate-500" />}
              <span className="max-w-[160px] truncate text-slate-700">{user.email}</span>
              <span className="text-[10px] uppercase tracking-wide text-slate-400 border-l border-slate-200 pl-1.5 ml-0.5">
                {user.role}
              </span>
            </Badge>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50">
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {error && (
          <Card className="mb-4 border-rose-200">
            <CardContent className="p-4 text-sm text-rose-700 bg-rose-50">
              Failed to load data: {error}. <button className="underline" onClick={refresh}>Try again</button>
            </CardContent>
          </Card>
        )}

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className={`mb-6 ${isAdmin ? "grid-cols-5 max-w-xl" : "grid-cols-3 max-w-md"} grid w-full`}>
            {tabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
                <t.icon className="h-4 w-4" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="tracker" className="mt-0">
            <TrackerTab
              rows={rows}
              loading={loading}
              expertsFromDb={experts}
              userRole={user.role}
              onSaved={handleSaved}
              onDeleted={handleDeleted}
              onRefresh={refresh}
            />
          </TabsContent>

          <TabsContent value="dashboard" className="mt-0">
            <DashboardTab rows={rows} />
          </TabsContent>

          <TabsContent value="sop" className="mt-0">
            <SopGuideTab />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="users" className="mt-0">
              <UsersTab
                currentUserId={user.id}
                expertsFromDb={experts}
                onUsersChanged={refresh}
              />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="settings" className="mt-0">
              <SettingsTab onImported={refresh} onSynced={refresh} />
            </TabsContent>
          )}
        </Tabs>
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-1">
          <span>Mock Tracker — candidate interview manager with Google Sheets sync.</span>
          <span>
            Signed in as <strong className="text-slate-700">{user.email}</strong> ({user.role}).
            {" "}
            {isAdmin
              ? "Sync to Google Sheets from the Settings tab."
              : "Ask an admin to sync to Google Sheets."}
          </span>
        </div>
      </footer>
    </div>
  );
}
