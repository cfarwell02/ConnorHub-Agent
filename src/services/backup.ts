import { execFile } from "node:child_process";
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const BACKUP_ROOT = "/srv/connorhub/Backups";

const BACKUP_PATHS = [
  "/srv/connorhub/Archive",
  "/srv/connorhub/Assets",
  "/srv/connorhub/Docs",
  "/srv/connorhub/Learning",
  "/srv/connorhub/School",
  "/srv/connorhub/Templates",
];

export type BackupResult = {
  filename: string;
  path: string;
  sizeBytes: number;
  createdAt: string;
};

export async function createBackup(): Promise<BackupResult> {
  await mkdir(BACKUP_ROOT, {
    recursive: true,
  });

  const createdAt = new Date();

  const timestamp = createdAt.toISOString().replace(/[:.]/g, "-");

  const filename = `connorhub-${timestamp}.tar.gz`;

  const backupPath = path.join(BACKUP_ROOT, filename);

  await execFileAsync("tar", [
    "-czf",
    backupPath,

    "--exclude=._*",
    "--exclude=.DS_Store",
    "--exclude=~$*",

    ...BACKUP_PATHS.flatMap((backupPath) => [
      "-C",
      path.dirname(backupPath),
      path.basename(backupPath),
    ]),
  ]);

  const backupStats = await stat(backupPath);

  return {
    filename,
    path: backupPath,
    sizeBytes: backupStats.size,
    createdAt: createdAt.toISOString(),
  };
}

export async function listBackups(): Promise<BackupResult[]> {
  await mkdir(BACKUP_ROOT, {
    recursive: true,
  });

  const entries = await readdir(BACKUP_ROOT, {
    withFileTypes: true,
  });

  const backups: BackupResult[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".tar.gz")) {
      continue;
    }

    const backupPath = path.join(BACKUP_ROOT, entry.name);

    const backupStats = await stat(backupPath);

    backups.push({
      filename: entry.name,
      path: backupPath,
      sizeBytes: backupStats.size,
      createdAt: backupStats.birthtime.toISOString(),
    });
  }

  return backups.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
