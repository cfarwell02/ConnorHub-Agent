import { execFile } from "node:child_process";
import { readdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const PROJECTS_ROOT =
  process.env.CONNORHUB_PROJECTS_ROOT ?? "/srv/connorhub/Projects";

export type ProjectStatus = {
  name: string;
  path: string;
  branch: string | null;
  clean: boolean;
  changedFiles: number;
  ahead: number | null;
  behind: number | null;
};

export async function getProjectStatuses(): Promise<ProjectStatus[]> {
  if (os.platform() !== "linux") {
    throw new Error(
      "ConnorHub project status is only available on the server device.",
    );
  }

  const entries = await readdir(PROJECTS_ROOT, {
    withFileTypes: true,
  });

  const projects: ProjectStatus[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const projectPath = path.join(PROJECTS_ROOT, entry.name);

    const isGitRepo = await checkIsGitRepository(projectPath);

    if (!isGitRepo) {
      continue;
    }

    projects.push(await getProjectStatus(entry.name, projectPath));
  }

  return projects.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, {
      sensitivity: "base",
    }),
  );
}

async function checkIsGitRepository(projectPath: string): Promise<boolean> {
  try {
    await execFileAsync("git", ["rev-parse", "--is-inside-work-tree"], {
      cwd: projectPath,
    });

    return true;
  } catch {
    return false;
  }
}

async function getProjectStatus(
  name: string,
  projectPath: string,
): Promise<ProjectStatus> {
  const [{ stdout: branchOutput }, { stdout: statusOutput }] =
    await Promise.all([
      execFileAsync("git", ["branch", "--show-current"], {
        cwd: projectPath,
      }),

      execFileAsync("git", ["status", "--porcelain"], {
        cwd: projectPath,
      }),
    ]);

  const changedFiles = statusOutput.split("\n").filter(Boolean).length;

  const tracking = await getTrackingStatus(projectPath);

  return {
    name,
    path: projectPath,
    branch: branchOutput.trim() || null,
    clean: changedFiles === 0,
    changedFiles,
    ahead: tracking?.ahead ?? null,
    behind: tracking?.behind ?? null,
  };
}

async function getTrackingStatus(projectPath: string): Promise<{
  ahead: number;
  behind: number;
} | null> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["rev-list", "--left-right", "--count", "@{upstream}...HEAD"],
      {
        cwd: projectPath,
      },
    );

    const [behindValue = 0, aheadValue = 0] = stdout
      .trim()
      .split(/\s+/)
      .map(Number);
    if (!Number.isFinite(aheadValue) || !Number.isFinite(behindValue)) {
      return null;
    }

    return {
      ahead: aheadValue,
      behind: behindValue,
    };
  } catch {
    return null;
  }
}
