"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen, Target, ClipboardCheck, TrendingUp, Trophy, AlertTriangle,
  ShieldCheck, ListChecks, ArrowRight, ArrowLeft, CheckCircle2, Circle, XCircle
} from "lucide-react";

type PageKey = "overview" | "before" | "mock1" | "mock2" | "mock3" | "readiness" | "rejection" | "rules";

const PAGES: Array<{ key: PageKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: "overview", label: "Overview & Principles", icon: BookOpen },
  { key: "before", label: "Before Mock 1", icon: Target },
  { key: "mock1", label: "Mock 1 — Diagnostic", icon: ClipboardCheck },
  { key: "mock2", label: "Mock 2 — Validation", icon: TrendingUp },
  { key: "mock3", label: "Mock 3 — Simulation", icon: Trophy },
  { key: "readiness", label: "Green / Yellow / Red", icon: ShieldCheck },
  { key: "rejection", label: "Rejection Analysis", icon: AlertTriangle },
  { key: "rules", label: "Expert Rules & Flow", icon: ListChecks },
];

const PAGE_ORDER: PageKey[] = ["overview", "before", "mock1", "mock2", "mock3", "readiness", "rejection", "rules"];

export function SopGuideTab() {
  const [page, setPage] = useState<PageKey>("overview");
  const currentIdx = PAGE_ORDER.indexOf(page);

  const goNext = () => {
    if (currentIdx < PAGE_ORDER.length - 1) setPage(PAGE_ORDER[currentIdx + 1]);
  };
  const goPrev = () => {
    if (currentIdx > 0) setPage(PAGE_ORDER[currentIdx - 1]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
      {/* Sidebar navigation */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-sky-600" />
              SOP Sections
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1">
            {PAGES.map((p) => {
              const active = p.key === page;
              return (
                <button
                  key={p.key}
                  onClick={() => setPage(p.key)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    active
                      ? "bg-sky-50 text-sky-700 font-semibold border border-sky-200"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <p.icon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{p.label}</span>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </aside>

      {/* Main content */}
      <div className="min-w-0 space-y-6">
        {page === "overview" && <OverviewPage />}
        {page === "before" && <BeforeMock1Page />}
        {page === "mock1" && <Mock1Page />}
        {page === "mock2" && <Mock2Page />}
        {page === "mock3" && <Mock3Page />}
        {page === "readiness" && <ReadinessPage />}
        {page === "rejection" && <RejectionPage />}
        {page === "rules" && <RulesPage />}

        {/* Prev / Next navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <Button
            variant="outline"
            size="sm"
            onClick={goPrev}
            disabled={currentIdx === 0}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" /> Previous
          </Button>
          <span className="text-xs text-slate-400">
            Section {currentIdx + 1} of {PAGE_ORDER.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goNext}
            disabled={currentIdx === PAGE_ORDER.length - 1}
            className="gap-1.5"
          >
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============ Shared UI helpers ============

function Callout({ type = "blue", title, children }: { type?: "blue" | "green" | "yellow" | "red"; title?: string; children: React.ReactNode }) {
  const styles = {
    blue: "border-l-sky-500 bg-sky-50",
    green: "border-l-emerald-500 bg-emerald-50",
    yellow: "border-l-amber-500 bg-amber-50",
    red: "border-l-rose-500 bg-rose-50",
  }[type];
  const titleColor = {
    blue: "text-sky-700",
    green: "text-emerald-700",
    yellow: "text-amber-700",
    red: "text-rose-700",
  }[type];
  return (
    <div className={`border-l-4 ${styles} rounded-r-lg p-4 my-4`}>
      {title && <p className={`font-semibold text-sm mb-1 ${titleColor}`}>{title}</p>}
      <div className="text-sm text-slate-700 leading-relaxed">{children}</div>
    </div>
  );
}

function Tag({ children, color = "blue" }: { children: React.ReactNode; color?: "blue" | "green" | "yellow" | "red" | "purple" }) {
  const styles = {
    blue: "bg-sky-100 text-sky-700",
    green: "bg-emerald-100 text-emerald-700",
    yellow: "bg-amber-100 text-amber-700",
    red: "bg-rose-100 text-rose-700",
    purple: "bg-violet-100 text-violet-700",
  }[color];
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${styles}`}>{children}</span>;
}

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 mt-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
          <CheckCircle2 className="h-4 w-4 text-sky-500 flex-shrink-0 mt-0.5" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function StatusCard({ color, title, children }: { color: "green" | "yellow" | "red"; title: string; children: React.ReactNode }) {
  const styles = {
    green: "bg-emerald-50 border-emerald-200",
    yellow: "bg-amber-50 border-amber-200",
    red: "bg-rose-50 border-rose-200",
  }[color];
  return (
    <div className={`rounded-lg border p-4 ${styles}`}>
      <h4 className="font-semibold text-sm text-slate-800 mb-1">{title}</h4>
      <div className="text-sm text-slate-600 leading-relaxed">{children}</div>
    </div>
  );
}

// ============ Page components ============

function OverviewPage() {
  return (
    <Card>
      <CardHeader>
        <Badge className="w-fit bg-sky-100 text-sky-700">Section 1</Badge>
        <CardTitle className="text-2xl">Purpose and Operating Principle</CardTitle>
        <CardDescription>
          The objective of this three-mock program is to make candidates genuinely interview-ready for Software Developer opportunities. The expert is not only an interviewer or evaluator; the expert owns the full improvement cycle.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Callout type="blue" title="Core principle">
          Do not measure success by the number of mock interviews completed. Measure success by the number of candidate weaknesses identified, improved, re-tested and converted into interview-ready skills.
        </Callout>

        <div>
          <h3 className="font-semibold text-slate-800 mb-3">What the Expert Is Responsible For</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-4">
                <Tag>Diagnosis</Tag>
                <Checklist items={[
                  "Identify the candidate's actual weaknesses instead of giving generic feedback.",
                  "Understand why the candidate is getting rejected and identify repeated rejection patterns.",
                  "Separate knowledge gaps from interview-performance problems.",
                  "Document evidence, not impressions.",
                ]} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <Tag color="green">Improvement Ownership</Tag>
                <Checklist items={[
                  "Create a specific improvement plan with measurable tasks.",
                  "Track whether the candidate completed assigned work before the next mock.",
                  "Re-test previously weak areas.",
                  "Classify every important gap as fixed, improving, unresolved or new.",
                ]} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <Tag color="purple">Role Alignment</Tag>
                <Checklist items={[
                  "Prepare the candidate according to resume, experience, primary stack and target role.",
                  "Use target job descriptions where available.",
                  "Match system-design depth to seniority.",
                  "Test technologies that appear on the resume for real hands-on depth.",
                ]} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <Tag color="yellow">Readiness Decision</Tag>
                <Checklist items={[
                  "Improve communication, structured thinking, confidence and follow-up handling.",
                  "Analyze real interview rejection feedback.",
                  "Decide whether the candidate is Green, Yellow or Red.",
                  "Give a defensible recommendation for next steps.",
                ]} />
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-slate-800 mb-3">Three-Mock Progression</h3>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {["Mock 1: Diagnose", "Targeted Improvement", "Mock 2: Validate", "Focused Correction", "Mock 3: Simulate", "Readiness Decision", "Real Interview Feedback Loop"].map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-lg font-semibold ${i === 0 || i === 2 || i === 4 ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600"}`}>{step}</span>
                {i < 6 && <ArrowRight className="h-3.5 w-3.5 text-slate-400" />}
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left p-3 font-semibold">Stage</th>
                <th className="text-left p-3 font-semibold">Primary Outcome</th>
                <th className="text-left p-3 font-semibold">Expert Question</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr><td className="p-3 font-medium">Mock 1 — Diagnostic</td><td className="p-3">Find what is preventing the candidate from clearing interviews.</td><td className="p-3 italic text-slate-500">What is the real root cause of rejection?</td></tr>
              <tr><td className="p-3 font-medium">Mock 2 — Improvement Validation</td><td className="p-3">Check whether Mock 1 gaps were actually fixed and test deeper technical ability.</td><td className="p-3 italic text-slate-500">Did the candidate improve in the areas we assigned?</td></tr>
              <tr><td className="p-3 font-medium">Mock 3 — Final Simulation</td><td className="p-3">Run a realistic interview and decide if the candidate can perform independently.</td><td className="p-3 italic text-slate-500">Would I recommend this candidate for a real interview tomorrow?</td></tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function BeforeMock1Page() {
  return (
    <Card>
      <CardHeader>
        <Badge className="w-fit bg-sky-100 text-sky-700">Section 2</Badge>
        <CardTitle className="text-2xl">Preparation Before Mock 1</CardTitle>
        <CardDescription>
          Before the first mock, the expert must study the candidate. A generic mock is not acceptable. Question selection, depth and pressure must match the candidate's background and target role.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-4"><h4 className="font-semibold text-slate-800 mb-2">Candidate Profile</h4><ul className="text-sm text-slate-600 space-y-1 list-disc pl-4"><li>Latest resume</li><li>Years of experience</li><li>Primary programming language</li><li>Core technology stack</li><li>Current and previous projects</li></ul></CardContent></Card>
          <Card><CardContent className="pt-4"><h4 className="font-semibold text-slate-800 mb-2">Interview Context</h4><ul className="text-sm text-slate-600 space-y-1 list-disc pl-4"><li>Target role</li><li>Target companies</li><li>Available job descriptions</li><li>Number of interviews attended</li><li>Rounds where rejection usually happens</li></ul></CardContent></Card>
          <Card><CardContent className="pt-4"><h4 className="font-semibold text-slate-800 mb-2">Performance History</h4><ul className="text-sm text-slate-600 space-y-1 list-disc pl-4"><li>Previous interview feedback</li><li>Known rejection reasons</li><li>Strongest areas</li><li>Weakest areas</li><li>Current preparation strategy</li></ul></CardContent></Card>
        </div>

        <Callout type="yellow" title="Customization rule">
          A Java Backend Developer, React Developer and Full Stack Developer should not receive the same mock. A fresher and a seven-year experienced engineer should not be tested at the same system-design depth.
        </Callout>

        <div>
          <h3 className="font-semibold text-slate-800 mb-3">Recommended Expert Intake Record</h3>
          <p className="text-sm text-slate-500 mb-3">Before Mock 1 begins, maintain a short record so later mocks can be compared against a stable baseline.</p>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr><th className="text-left p-3 font-semibold">Field</th><th className="text-left p-3 font-semibold">What the Expert Should Record</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                <tr><td className="p-3 font-medium">Candidate objective</td><td className="p-3">Target role, seniority and preferred technology stack.</td></tr>
                <tr><td className="p-3 font-medium">Resume risks</td><td className="p-3">Skills or tools that look broad, unsupported or likely to attract interviewer follow-ups.</td></tr>
                <tr><td className="p-3 font-medium">Rejection pattern</td><td className="p-3">Rounds, question types and recurring areas where the candidate struggles.</td></tr>
                <tr><td className="p-3 font-medium">Known strengths</td><td className="p-3">Areas that can be used to build confidence and differentiate the candidate.</td></tr>
                <tr><td className="p-3 font-medium">Initial hypothesis</td><td className="p-3">The expert's best current explanation for why the candidate is not clearing interviews.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Mock1Page() {
  return (
    <Card>
      <CardHeader>
        <Badge className="w-fit bg-sky-100 text-sky-700">Section 3</Badge>
        <CardTitle className="text-2xl">Mock Interview 1 — Diagnostic and Gap Identification</CardTitle>
        <CardDescription>Recommended duration: 90–120 minutes. Avoid excessive coaching during this mock. The candidate should perform independently so the expert can observe real behavior.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Callout type="blue" title="Primary question">What exactly is preventing this candidate from clearing interviews?</Callout>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/40"><strong className="block text-sm text-sky-700 uppercase tracking-wide mb-1">Before</strong><span className="text-sm text-slate-600">Study resume, validate credibility and review previous rejections.</span></div>
          <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/40"><strong className="block text-sm text-sky-700 uppercase tracking-wide mb-1">During</strong><span className="text-sm text-slate-600">Observe actual interview behavior across communication, coding, fundamentals, project depth and behavioral answers.</span></div>
          <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/40"><strong className="block text-sm text-sky-700 uppercase tracking-wide mb-1">After</strong><span className="text-sm text-slate-600">Produce a detailed gap report and convert every serious weakness into a specific action plan.</span></div>
        </div>

        <div>
          <h3 className="font-semibold text-slate-800 mb-3">Mock 1 Interview Structure</h3>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr><th className="text-left p-3 font-semibold">Section</th><th className="text-left p-3 font-semibold">Recommended Time</th><th className="text-left p-3 font-semibold">Primary Evaluation</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                <tr><td className="p-3">Introduction</td><td className="p-3">5–10 min</td><td className="p-3">Communication, confidence and structure</td></tr>
                <tr><td className="p-3">Resume Walkthrough</td><td className="p-3">10 min</td><td className="p-3">Role clarity and credibility</td></tr>
                <tr><td className="p-3">Project Deep Dive</td><td className="p-3">15–20 min</td><td className="p-3">Architecture, contribution and depth</td></tr>
                <tr><td className="p-3">DSA / Coding</td><td className="p-3">30–40 min</td><td className="p-3">Problem solving and coding process</td></tr>
                <tr><td className="p-3">Technical Fundamentals</td><td className="p-3">15–20 min</td><td className="p-3">Core stack and follow-up depth</td></tr>
                <tr><td className="p-3">Database / SQL</td><td className="p-3">10–15 min</td><td className="p-3">Practical database knowledge</td></tr>
                <tr><td className="p-3">Behavioral</td><td className="p-3">10–15 min</td><td className="p-3">STAR, ownership and communication</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <Callout type="blue" title="Expected candidate process (DSA/Coding)">
          Understand → Clarify → Confirm input/output → Discuss edge cases → Brute force → Optimize → Explain algorithm → Code → Dry run → Time complexity → Space complexity
        </Callout>

        <div>
          <h3 className="font-semibold text-slate-800 mb-3">After Mock 1 — Mandatory Expert Output</h3>
          <p className="text-sm text-slate-500 mb-3">Never finish with comments such as <code className="bg-slate-100 px-1 rounded">Improve coding and communication</code>. Every major observation must become a documented gap with evidence and a specific intervention.</p>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr><th className="text-left p-3 font-semibold">Gap Report Section</th><th className="text-left p-3 font-semibold">Required Content</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                <tr><td className="p-3 font-medium">Introduction</td><td className="p-3">Score, issue, observed example and required improvement</td></tr>
                <tr><td className="p-3 font-medium">Communication</td><td className="p-3">Clarity issues, filler words and explanation quality</td></tr>
                <tr><td className="p-3 font-medium">Resume Knowledge</td><td className="p-3">Weak or unsupported claims and missing depth</td></tr>
                <tr><td className="p-3 font-medium">Project Explanation</td><td className="p-3">Architecture, ownership and production knowledge</td></tr>
                <tr><td className="p-3 font-medium">Coding</td><td className="p-3">Code quality, edge cases, debugging and speed</td></tr>
                <tr><td className="p-3 font-medium">DSA</td><td className="p-3">Weak patterns and specific practice required</td></tr>
                <tr><td className="p-3 font-medium">Technical Fundamentals</td><td className="p-3">Strong topics, weak topics and action plan</td></tr>
                <tr><td className="p-3 font-medium">Database</td><td className="p-3">Weak concepts and practical work required</td></tr>
                <tr><td className="p-3 font-medium">System Design</td><td className="p-3">Current level and structure gaps</td></tr>
                <tr><td className="p-3 font-medium">Behavioral</td><td className="p-3">STAR quality, ownership and communication</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-slate-800 mb-3">Mock 1 Gap Priority</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatusCard color="red" title="Critical Gaps">Issues that can directly cause rejection: inability to solve medium DSA, poor project explanation, weak core fundamentals or serious communication gaps.</StatusCard>
            <StatusCard color="yellow" title="Medium Gaps">Issues that reduce performance: weak SQL, limited system-design depth or inconsistent follow-up handling.</StatusCard>
            <StatusCard color="green" title="Minor Gaps">Polishing issues: filler words, answer length, small syntax slips and introduction refinement.</StatusCard>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Mock2Page() {
  return (
    <Card>
      <CardHeader>
        <Badge className="w-fit bg-violet-100 text-violet-700">Section 4</Badge>
        <CardTitle className="text-2xl">Mock Interview 2 — Improvement Validation and Advanced Testing</CardTitle>
        <CardDescription>Recommended duration: 90–120 minutes. Mock 2 must be built from the weaknesses documented in Mock 1. The expert should not start from zero.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Callout type="blue" title="Primary question">Did the candidate actually improve after Mock 1?</Callout>

        <Callout type="yellow" title="Re-test rule">
          If introduction was weak, ask it again. If sliding window was weak, give a sliding-window problem. If SQL was weak, ask SQL again. If project explanation was weak, revisit the same project and increase follow-up depth.
        </Callout>

        <div>
          <h3 className="font-semibold text-slate-800 mb-3">Mock 2 Structure</h3>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr><th className="text-left p-3 font-semibold">Section</th><th className="text-left p-3 font-semibold">Focus</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                <tr><td className="p-3">Previous weak areas</td><td className="p-3">Verify that assigned corrections were implemented</td></tr>
                <tr><td className="p-3">Advanced coding</td><td className="p-3">Medium problem plus follow-up variation</td></tr>
                <tr><td className="p-3">Technical cross-questioning</td><td className="p-3">Depth, trade-offs and real understanding</td></tr>
                <tr><td className="p-3">Project pressure test</td><td className="p-3">Scale, failure, monitoring and troubleshooting</td></tr>
                <tr><td className="p-3">System Design / LLD</td><td className="p-3">Experience-appropriate structured design</td></tr>
                <tr><td className="p-3">Behavioral cross-questions</td><td className="p-3">Ownership, detail and measurable outcomes</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-slate-800 mb-3">After Mock 2 — Gap Comparison</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-4"><Tag color="green">Fixed</Tag><p className="text-sm text-slate-600 mt-2">The issue is no longer a material rejection risk.</p></CardContent></Card>
            <Card><CardContent className="pt-4"><Tag color="yellow">Improving</Tag><p className="text-sm text-slate-600 mt-2">Progress is visible, but performance is not yet consistent.</p></CardContent></Card>
            <Card><CardContent className="pt-4"><Tag color="red">Unresolved</Tag><p className="text-sm text-slate-600 mt-2">The candidate repeated the same issue despite the action plan.</p></CardContent></Card>
            <Card><CardContent className="pt-4"><Tag color="purple">New</Tag><p className="text-sm text-slate-600 mt-2">A weakness appeared at higher difficulty or under deeper follow-up.</p></CardContent></Card>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-slate-800 mb-3">Priority Plan</h3>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr><th className="text-left p-3 font-semibold">Priority</th><th className="text-left p-3 font-semibold">Action</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                <tr><td className="p-3 font-semibold text-rose-700">P1 — Critical</td><td className="p-3">Must be fixed before the next serious interview.</td></tr>
                <tr><td className="p-3 font-semibold text-amber-700">P2 — Important</td><td className="p-3">Needs improvement because it can reduce performance.</td></tr>
                <tr><td className="p-3 font-semibold text-emerald-700">P3 — Polishing</td><td className="p-3">Useful refinement but not usually a primary rejection cause.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Mock3Page() {
  return (
    <Card>
      <CardHeader>
        <Badge className="w-fit bg-emerald-100 text-emerald-700">Section 5</Badge>
        <CardTitle className="text-2xl">Mock Interview 3 — Final Real Interview Simulation</CardTitle>
        <CardDescription>Recommended duration: 90–120 minutes. Mock 3 should feel like a real interview. The expert should not coach during the mock; take notes and provide feedback after completion.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Callout type="blue" title="Primary question">If this candidate had an actual interview tomorrow, would I recommend sending them?</Callout>

        <div>
          <h3 className="font-semibold text-slate-800 mb-3">Mock 3 Structure</h3>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr><th className="text-left p-3 font-semibold">Round</th><th className="text-left p-3 font-semibold">Recommended Time</th><th className="text-left p-3 font-semibold">Expectation</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                <tr><td className="p-3">Introduction + Resume</td><td className="p-3">5–10 min</td><td className="p-3">Clear positioning and concise answers</td></tr>
                <tr><td className="p-3">Coding</td><td className="p-3">30–40 min</td><td className="p-3">Independent solve, optimize, test and explain</td></tr>
                <tr><td className="p-3">Technical Deep Dive</td><td className="p-3">20–25 min</td><td className="p-3">Strong primary-stack depth and follow-ups</td></tr>
                <tr><td className="p-3">System Design</td><td className="p-3">20–30 min</td><td className="p-3">Structured design with trade-offs</td></tr>
                <tr><td className="p-3">Behavioral</td><td className="p-3">10–15 min</td><td className="p-3">Ownership, maturity and STAR</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <Callout type="blue" title="Expected design flow (System Design)">
          Requirements → Functional requirements → Non-functional requirements → Scale → APIs → Data model → High-level design → Components → Database → Caching → Queue → Scaling → Failure handling → Monitoring → Security → Trade-offs
        </Callout>

        <div>
          <h3 className="font-semibold text-slate-800 mb-3">Final Readiness Classification</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatusCard color="green" title="GREEN — Interview Ready">Good communication, strong project understanding, good coding, strong technical fundamentals, structured system design and credible behavioral responses.<br /><strong className="mt-2 block">Recommendation:</strong> Actively attend interviews.</StatusCard>
            <StatusCard color="yellow" title="YELLOW — Almost Ready">Mostly good performance with one or two remaining risk areas.<br /><strong className="mt-2 block">Recommendation:</strong> Continue selective interviews while completing targeted improvement.</StatusCard>
            <StatusCard color="red" title="RED — Not Ready">Major gaps such as inability to solve basic coding questions, weak fundamentals, poor project explanation or communication that prevents clear evaluation.<br /><strong className="mt-2 block">Recommendation:</strong> Complete another improvement cycle before aggressive interviewing.</StatusCard>
          </div>
        </div>

        <Callout type="red" title="Hard-risk rule">
          A serious weakness in coding, communication, project credibility or core technical knowledge may still justify Yellow or Red even when the weighted total appears acceptable.
        </Callout>
      </CardContent>
    </Card>
  );
}

function ReadinessPage() {
  return (
    <Card>
      <CardHeader>
        <Badge className="w-fit bg-emerald-100 text-emerald-700">Readiness Decision</Badge>
        <CardTitle className="text-2xl">Green / Yellow / Red Candidate Readiness</CardTitle>
        <CardDescription>
          Use this page after Mock 3 — or whenever a manager needs a clear readiness decision. The status must be supported by evidence from mock performance, real interview feedback, candidate responsiveness and demonstrated improvement.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusCard color="green" title="GREEN — Interview Ready">
            The candidate demonstrates good communication, credible project depth, reliable coding/problem solving, strong technical fundamentals and interview behavior appropriate to the target role.
            <br /><strong className="mt-2 block">Recommendation:</strong> Actively schedule and attend suitable interviews.
          </StatusCard>
          <StatusCard color="yellow" title="YELLOW — Almost Ready">
            The candidate is generally capable but still has one or two material risk areas that may cause rejection in specific rounds.
            <br /><strong className="mt-2 block">Recommendation:</strong> Continue selective interviews while completing targeted improvement and re-testing.
          </StatusCard>
          <StatusCard color="red" title="RED — Not Ready">
            The candidate has one or more major gaps in coding, technical fundamentals, project credibility, communication, system design or interview execution.
            <br /><strong className="mt-2 block">Recommendation:</strong> Complete another focused improvement cycle before aggressive interviewing.
          </StatusCard>
        </div>

        <div>
          <h3 className="font-semibold text-slate-800 mb-3">Final Candidate Scorecard</h3>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr><th className="text-left p-3 font-semibold">Area</th><th className="text-left p-3 font-semibold">Weight</th><th className="text-left p-3 font-semibold">Readiness Evidence to Verify</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                <tr><td className="p-3">Communication</td><td className="p-3 font-semibold">10%</td><td className="p-3">Clear, structured and concise explanation under pressure.</td></tr>
                <tr><td className="p-3">Introduction</td><td className="p-3 font-semibold">5%</td><td className="p-3">Strong role positioning in approximately 60–90 seconds.</td></tr>
                <tr><td className="p-3">Resume Knowledge</td><td className="p-3 font-semibold">10%</td><td className="p-3">Can defend technologies, responsibilities and claims on the resume.</td></tr>
                <tr><td className="p-3">Project Knowledge</td><td className="p-3 font-semibold">15%</td><td className="p-3">Can explain architecture, contribution, production issues, decisions and trade-offs.</td></tr>
                <tr><td className="p-3">DSA / Problem Solving</td><td className="p-3 font-semibold">20%</td><td className="p-3">Recognizes patterns, explains approach, optimizes and handles follow-ups.</td></tr>
                <tr><td className="p-3">Coding</td><td className="p-3 font-semibold">10%</td><td className="p-3">Correctness, readable code, edge cases, testing and debugging.</td></tr>
                <tr><td className="p-3">Technical Fundamentals</td><td className="p-3 font-semibold">15%</td><td className="p-3">Depth in the primary language, framework and role-specific fundamentals.</td></tr>
                <tr><td className="p-3">Database</td><td className="p-3 font-semibold">5%</td><td className="p-3">SQL, indexing, transactions, schema and performance reasoning.</td></tr>
                <tr><td className="p-3">System Design</td><td className="p-3 font-semibold">5%</td><td className="p-3">Structured architecture and trade-offs appropriate to seniority.</td></tr>
                <tr><td className="p-3">Behavioral</td><td className="p-3 font-semibold">5%</td><td className="p-3">STAR, ownership, authenticity and measurable outcomes.</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <Callout type="red" title="Hard-risk rule">
          A serious weakness in coding, communication, project credibility or core technical knowledge can justify Yellow or Red even when the weighted total appears acceptable. The expert must document the exact evidence behind the status.
        </Callout>
      </CardContent>
    </Card>
  );
}

function RejectionPage() {
  return (
    <Card>
      <CardHeader>
        <Badge className="w-fit bg-amber-100 text-amber-700">Section 6</Badge>
        <CardTitle className="text-2xl">Rejection Analysis Process</CardTitle>
        <CardDescription>
          Rejection analysis continues after Mock 3. Every real interview becomes new preparation data. The objective is to identify the true rejection area and update the training plan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold text-slate-800 mb-3">Information to Capture After Every Rejection</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-4"><h4 className="font-semibold text-slate-800 mb-2">Interview Data</h4><ul className="text-sm text-slate-600 space-y-1 list-disc pl-4"><li>Company</li><li>Position</li><li>Interview date</li><li>Round</li></ul></CardContent></Card>
            <Card><CardContent className="pt-4"><h4 className="font-semibold text-slate-800 mb-2">Question Data</h4><ul className="text-sm text-slate-600 space-y-1 list-disc pl-4"><li>Questions asked</li><li>Difficult questions</li><li>Areas where candidate got stuck</li></ul></CardContent></Card>
            <Card><CardContent className="pt-4"><h4 className="font-semibold text-slate-800 mb-2">Feedback Data</h4><ul className="text-sm text-slate-600 space-y-1 list-disc pl-4"><li>Candidate self-assessment</li><li>Recruiter feedback</li><li>Interviewer feedback</li></ul></CardContent></Card>
            <Card><CardContent className="pt-4"><h4 className="font-semibold text-slate-800 mb-2">Action Data</h4><ul className="text-sm text-slate-600 space-y-1 list-disc pl-4"><li>Probable rejection reason</li><li>Primary rejection category</li><li>Corrective action</li></ul></CardContent></Card>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-slate-800 mb-3">Standard Rejection Categories</h3>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr><th className="text-left p-3 font-semibold">Category</th><th className="text-left p-3 font-semibold">Typical Failure Pattern</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                <tr><td className="p-3 font-medium">DSA</td><td className="p-3">Could not identify the correct algorithm, data structure or optimization.</td></tr>
                <tr><td className="p-3 font-medium">Coding</td><td className="p-3">Incomplete solution, syntax errors, poor code quality or weak testing.</td></tr>
                <tr><td className="p-3 font-medium">Technical</td><td className="p-3">Lack of depth in primary language, framework or architecture concepts.</td></tr>
                <tr><td className="p-3 font-medium">Project</td><td className="p-3">Unable to explain own implementation, contribution or decisions.</td></tr>
                <tr><td className="p-3 font-medium">System Design</td><td className="p-3">Unstructured approach, missing scalability or trade-off thinking.</td></tr>
                <tr><td className="p-3 font-medium">Database</td><td className="p-3">Weak SQL, indexing, transactions, schema or performance knowledge.</td></tr>
                <tr><td className="p-3 font-medium">Communication</td><td className="p-3">Unable to explain clearly or think aloud effectively.</td></tr>
                <tr><td className="p-3 font-medium">Behavioral</td><td className="p-3">Weak STAR answers, low ownership or vague examples.</td></tr>
                <tr><td className="p-3 font-medium">Confidence</td><td className="p-3">Candidate becomes nervous, silent or abandons structured thinking.</td></tr>
                <tr><td className="p-3 font-medium">Resume Mismatch</td><td className="p-3">Resume claims technologies the candidate cannot defend.</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <Callout type="green" title="Quality of feedback">
          <strong>Bad:</strong> "Candidate rejected in technical round."<br />
          <strong>Better:</strong> "Candidate explained Java fundamentals but struggled with multithreading and could not justify when ConcurrentHashMap should be preferred over HashMap in a concurrent environment."
        </Callout>

        <div>
          <h3 className="font-semibold text-slate-800 mb-3">Root-Cause Loop</h3>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {["Interview Rejection", "Collect Questions", "Identify Failure Area", "Find Root Cause", "Assign Correction", "Re-test", "Validate Improvement"].map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-lg font-semibold ${i === 0 || i === 6 ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600"}`}>{step}</span>
                {i < 6 && <ArrowRight className="h-3.5 w-3.5 text-slate-400" />}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RulesPage() {
  return (
    <Card>
      <CardHeader>
        <Badge className="w-fit bg-slate-100 text-slate-700">Section 7 & 8</Badge>
        <CardTitle className="text-2xl">Expert Rules & End-to-End Flow</CardTitle>
        <CardDescription>Mandatory rules for experts and the complete operating flow that ties the three mocks together.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold text-slate-800 mb-3">Mandatory Rules for Experts</h3>
          <ol className="space-y-2">
            {[
              "Never conduct a generic mock without reviewing the candidate's resume.",
              "Every mock must have documented feedback.",
              "Feedback must contain examples, not only labels such as 'weak technically.'",
              "Mock 2 must test the weaknesses identified in Mock 1.",
              "Mock 3 must test unresolved weaknesses from both Mock 1 and Mock 2.",
              "Previous real interview rejection feedback must be included in future mocks.",
              "Distinguish a knowledge problem from an interview-performance problem.",
              "Every candidate must leave each mock with specific tasks, not vague advice.",
              "Track whether assigned tasks were actually completed before the next mock.",
              "The expert must Evaluate → Identify → Train → Re-test → Analyze → Improve → Validate.",
            ].map((rule, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center">{i + 1}</span>
                <span>{rule}</span>
              </li>
            ))}
          </ol>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold text-slate-800 mb-3">Specific vs Generic Feedback</h3>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr><th className="text-left p-3 font-semibold text-rose-600">Avoid</th><th className="text-left p-3 font-semibold text-emerald-600">Use Instead</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                <tr><td className="p-3">"Candidate is weak technically."</td><td className="p-3">"Candidate understands Spring Boot basics but cannot explain dependency injection, bean scopes, transaction management or exception handling."</td></tr>
                <tr><td className="p-3">"Practice DSA."</td><td className="p-3">"Complete 10 sliding-window problems before the next mock and explain each solution verbally before coding."</td></tr>
                <tr><td className="p-3">"Communication is weak."</td><td className="p-3">"Candidate often becomes silent while coding. Practice 20-minute think-aloud sessions and verbalize assumptions, approach changes and complexity."</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold text-slate-800 mb-3">End-to-End Operating Flow</h3>
          <p className="text-sm text-slate-500 mb-4">The three mocks should function as one continuous development process, not three disconnected interviews.</p>

          <div className="flex flex-wrap items-center gap-2 text-sm mb-3">
            {["Resume + JD", "Expert Analysis", "Mock 1", "Gap Report", "Improvement", "Mock 2", "Comparison"].map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-lg font-semibold ${i === 2 || i === 5 ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600"}`}>{step}</span>
                {i < 6 && <ArrowRight className="h-3.5 w-3.5 text-slate-400" />}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm mb-3">
            {["Priority Plan", "Focused Prep", "Mock 3", "Readiness", "Real Interviews", "Rejection Data", "Root Cause"].map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-lg font-semibold ${i === 2 ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600"}`}>{step}</span>
                {i < 6 && <ArrowRight className="h-3.5 w-3.5 text-slate-400" />}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {["Updated Plan", "Re-test", "Improvement", "Repeat"].map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-lg font-semibold ${i === 2 ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600"}`}>{step}</span>
                {i < 3 && <ArrowRight className="h-3.5 w-3.5 text-slate-400" />}
              </div>
            ))}
          </div>
        </div>

        <Callout type="green" title="Final standard">
          The expert's responsibility is not complete when the mock ends. It is complete only when the observed gap has been translated into an action, the action has been completed, the skill has been re-tested, and the candidate can demonstrate the improvement independently.
        </Callout>
      </CardContent>
    </Card>
  );
}
