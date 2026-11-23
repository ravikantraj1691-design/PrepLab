// Create an immediate backup of the current database.
import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

const db = new PrismaClient();
const BACKUP_DIR = "/home/z/my-project/download/backups";

async function main() {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  const [candidates, users, settings] = await Promise.all([
    db.candidate.findMany(),
    db.user.findMany(),
    db.setting.findMany(),
  ]);
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    candidates: candidates.map((c) => ({
      id: c.id, candidateName: c.candidateName, expert: c.expert, teamLead: c.teamLead,
      resumeStatus: c.resumeStatus, mockReportSent: c.mockReportSent,
      createdAt: c.createdAt, updatedAt: c.updatedAt,
      score: c.score, communication: c.communication, technicalKnowledge: c.technicalKnowledge, coding: c.coding,
      mock1Done: c.mock1Done, mock1Recording: c.mock1Recording, mock1Feedback: c.mock1Feedback, mock1NextDate: c.mock1NextDate,
      mock2Done: c.mock2Done, mock2Recording: c.mock2Recording, mock2Feedback: c.mock2Feedback, mock2NextDate: c.mock2NextDate, mock2DelayReason: c.mock2DelayReason,
      mock3Done: c.mock3Done, mock3Recording: c.mock3Recording, mock3Feedback: c.mock3Feedback, mock3NextDate: c.mock3NextDate, mock3DelayReason: c.mock3DelayReason,
      reasonNotDone: c.reasonNotDone, feedback: c.feedback,
    })),
    users: users.map((u) => ({
      id: u.id, email: u.email, role: u.role, expertEmail: u.expertEmail,
      passwordHash: u.passwordHash, createdAt: u.createdAt.toISOString(),
    })),
    settings: settings.filter((s) => s.key !== "sessionSecret").map((s) => ({ key: s.key, value: s.value })),
  };
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backup-${ts}.json`;
  const filepath = path.join(BACKUP_DIR, filename);
  await fs.writeFile(filepath, JSON.stringify(data, null, 2), "utf8");
  console.log(`Backup created: ${filepath}`);
  console.log(`  Candidates: ${candidates.length}`);
  console.log(`  Users: ${users.length}`);
  console.log(`  Settings: ${data.settings.length}`);
}
main().catch(console.error).finally(async () => { await db.$disconnect(); });
