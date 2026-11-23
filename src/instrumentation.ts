export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  if (process.env.VERCEL === "1" || process.env.DISABLE_AUTO_RESTORE === "1") {
    console.log("[startup] Running on serverless/managed host — auto-restore disabled (DB is source of truth).");
    return;
  }

  try {
    const { autoRestoreOnStartup } = await import("./lib/backup");
    const result = await autoRestoreOnStartup();
    if (result?.restored) {
      console.log(`[startup] Auto-restored ${result.candidates} candidates and ${result.users} users from backup: ${result.from}`);
    } else if (result === null) {
      console.log("[startup] DB is empty and no backup found — starting fresh.");
    } else {
      console.log("[startup] DB already has data — no restore needed.");
    }
  } catch (e) {
    console.error("[startup] Auto-restore check failed:", e);
  }
}
