"use client";

import dynamic from "next/dynamic";
import type { AppUser } from "./app-shell";

const AppShellClient = dynamic(() => import("./app-shell").then((m) => m.AppShell), {
  ssr: false,
  loading: () => <AppShellSkeleton />,
});

function AppShellSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600" />
          <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-4" />
        <div className="h-64 bg-slate-100 rounded-lg animate-pulse" />
      </main>
    </div>
  );
}

interface Props {
  user: AppUser;
}

export function AppShellClientOnly({ user }: Props) {
  return <AppShellClient user={user} />;
}
