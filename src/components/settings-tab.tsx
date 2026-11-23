"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, RefreshCw, Upload, Download, Cloud, ExternalLink, Info } from "lucide-react";

const APPS_SCRIPT_SNIPPET = `/**
 * Mock Tracker — Google Apps Script Web App
 * Paste this into Extensions → Apps Script in your Google Sheet, then
 * Deploy → New deployment → Web app → "Anyone" access → copy the /exec URL.
 */
var SHEET_NAME = "Mock Tracker";

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, sheet: SHEET_NAME }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents || "{}");
    if (body.action !== "replace") {
      return jsonOut({ ok: false, error: "Unknown action" });
    }
    var header = body.header || [];
    var rows = body.rows || [];
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    sheet.clearContents();
    var out = [header].concat(rows);
    sheet.getRange(1, 1, out.length, header.length).setValues(out);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, header.length).setFontWeight("bold");
    return jsonOut({ ok: true, rows: rows.length });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}`;

interface Props {
  onImported: () => void;
  onSynced: () => void;
}

export function SettingsTab({ onImported, onSynced }: Props) {
  const [appsScriptUrl, setAppsScriptUrl] = useState("");
  const [sheetName, setSheetName] = useState("Mock Tracker");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedAt, setSettingsSavedAt] = useState<number | null>(null);

  const [importing, setImporting] = useState(false);
  const [importReplace, setImportReplace] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const s = d.settings || {};
        if (s.appsScriptUrl) setAppsScriptUrl(s.appsScriptUrl);
        if (s.sheetName) setSheetName(s.sheetName);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { appsScriptUrl, sheetName } }),
      });
      setSettingsSavedAt(Date.now());
    } finally {
      setSavingSettings(false);
    }
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    setImportMessage(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const url = `/api/import${importReplace ? "?replace=1" : ""}`;
      const resp = await fetch(url, { method: "POST", body: fd });
      const data = await resp.json();
      if (!resp.ok) {
        setImportMessage(`Error: ${data.error || "Import failed"}`);
      } else {
        setImportMessage(`Imported ${data.inserted} rows, skipped ${data.skipped} (sheet: ${data.sheetName}).`);
        onImported();
      }
    } catch (e) {
      setImportMessage(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setImporting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    setSyncError(null);
    try {
      const resp = await fetch("/api/sync", { method: "POST" });
      const data = await resp.json();
      if (!resp.ok) {
        setSyncError(data.error || "Sync failed");
      } else {
        setSyncMessage(`Synced ${data.synced} rows to Google Sheets.`);
        onSynced();
      }
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : String(e));
    } finally {
      setSyncing(false);
    }
  };

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_SNIPPET);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // fallback: do nothing
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Google Sheets Sync setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-sky-600" />
            Google Sheets Sync
          </CardTitle>
          <CardDescription>
            Connect this app to your Google Sheet via a free Google Apps Script web app. No OAuth keys required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>How this works</AlertTitle>
            <AlertDescription>
              You deploy a tiny Google Apps Script as a web app inside your Google Sheet. The script gets a
              public-but-unguessable URL. Paste that URL below and the app can push every candidate row to your
              sheet with one click — replacing the sheet&apos;s contents each time.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Step 1 — Open your Google Sheet</Label>
            <p className="text-sm text-slate-600">
              Open the Google Sheet that has (or will have) your <code className="px-1 py-0.5 bg-slate-100 rounded">Mock Tracker</code> tab.
              From the top menu, choose <strong>Extensions → Apps Script</strong>.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Step 2 — Paste this code into the script editor</Label>
            <div className="relative">
              <Textarea
                value={APPS_SCRIPT_SNIPPET}
                readOnly
                rows={14}
                className="font-mono text-xs bg-slate-50"
              />
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2"
                onClick={copySnippet}
              >
                {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Step 3 — Deploy as a web app</Label>
            <ol className="text-sm text-slate-600 list-decimal list-inside space-y-1">
              <li>Click <strong>Deploy → New deployment</strong> in the script editor.</li>
              <li>Select type <strong>Web app</strong>.</li>
              <li>Set <strong>Execute as</strong> to <em>Me</em>, and <strong>Who has access</strong> to <em>Anyone</em>.</li>
              <li>Click <strong>Deploy</strong> and authorize when prompted.</li>
              <li>Copy the web app URL (ends in <code>/exec</code>).</li>
            </ol>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Step 4 — Paste the URL here and save</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={appsScriptUrl}
                onChange={(e) => setAppsScriptUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfy.../exec"
              />
              <Button onClick={saveSettings} disabled={savingSettings} variant="secondary">
                {savingSettings ? "Saving…" : "Save URL"}
              </Button>
            </div>
            {settingsSavedAt && (
              <p className="text-xs text-emerald-600 flex items-center gap-1">
                <Check className="h-3 w-3" /> Saved. You can now sync.
              </p>
            )}
            {appsScriptUrl && (
              <p className="text-xs">
                <a href={appsScriptUrl} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline inline-flex items-center gap-1">
                  Test the URL in your browser <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <Label className="text-sm font-medium">Step 5 — Push data to your sheet</Label>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <Button onClick={handleSync} disabled={syncing || !appsScriptUrl}>
                {syncing ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Cloud className="h-4 w-4 mr-1" />}
                {syncing ? "Syncing…" : "Sync to Google Sheets"}
              </Button>
              <span className="text-xs text-slate-500">
                Replaces the contents of the <code>Mock Tracker</code> sheet with the current data from this app.
              </span>
            </div>
            {syncMessage && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{syncMessage}</Badge>}
            {syncError && <Badge className="bg-rose-100 text-rose-700 border-rose-200">{syncError}</Badge>}
          </div>
        </CardContent>
      </Card>

      {/* Import / Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-violet-600" />
            Bulk Import / Export
          </CardTitle>
          <CardDescription>
            Seed the database from an .xlsx file, or download the current data as an .xlsx.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Import from Excel</Label>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={importReplace}
                  onChange={(e) => setImportReplace(e.target.checked)}
                  className="rounded"
                />
                Replace existing data (otherwise appends)
              </label>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImport(f);
                  e.target.value = "";
                }}
                disabled={importing}
              />
              {importing && <span className="text-xs text-slate-500 self-center">Importing…</span>}
            </div>
            {importMessage && (
              <p className={`text-xs ${importMessage.startsWith("Error") ? "text-rose-600" : "text-emerald-600"}`}>{importMessage}</p>
            )}
            <p className="text-xs text-slate-500">
              The file must have a sheet named <code>Mock Tracker</code> with the same column headers as the original spreadsheet.
              Excel serial dates are converted automatically.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <Label className="text-sm font-medium">Export current data</Label>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <a href="/api/export" download>
                <Button variant="secondary">
                  <Download className="h-4 w-4 mr-1" /> Download .xlsx
                </Button>
              </a>
              <span className="text-xs text-slate-500">
                Downloads all candidates as an Excel file with the same column layout as the original sheet.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
