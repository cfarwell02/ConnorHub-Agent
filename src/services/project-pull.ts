import { execFile } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const PROJECTS_ROOT = "/srv/connorhub/Projects";

export type ProjectPullResult = {
  name: string;
  status: "updated" | "already-current" | "skipped-dirty" | "failed";
  output?: string;
  error?: string;
};

export async function pullCleanProjects(): Promise<ProjectPullResult[]> {
  const entries = await readdir(PROJECTS_ROOT, {
    withFileTypes: true,
  });

  const results: ProjectPullResult[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const projectPath = path.join(PROJECTS_ROOT, entry.name);

    const isRepo = await isGitRepository(projectPath);

    if (!isRepo) {
      continue;
    }

    const { stdout: statusOutput } = await execFileAsync(
      "git",
      ["status", "--porcelain"],
      {
        cwd: projectPath,
      },
    );

    if (statusOutput.trim()) {
      results.push({
        name: entry.name,
        status: "skipped-dirty",
      });

      continue;
    }

    try {
      const { stdout } = await execFileAsync("git", ["pull", "--ff-only"], {
        cwd: projectPath,
        env: {
          ...process.env,
          GIT_TERMINAL_PROMPT: "0",
        },
      });

      const output = stdout.trim();

      results.push({
        name: entry.name,
        status: output.includes("Already up to date")
          ? "already-current"
          : "updated",
        output,
      });
    } catch (error) {
      results.push({
        name: entry.name,
        status: "failed",
        error: error instanceof Error ? error.message : "Git pull failed.",
      });
    }
  }

  return results;
}

async function isGitRepository(projectPath: string): Promise<boolean> {
  try {
    await execFileAsync("git", ["rev-parse", "--is-inside-work-tree"], {
      cwd: projectPath,
    });

    return true;
  } catch {
    return false;
  }
}
