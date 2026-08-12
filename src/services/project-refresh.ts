import { execFile } from "node:child_process";
import { readdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const PROJECTS_ROOT =
  process.env.CONNORHUB_PROJECTS_ROOT ?? "/srv/connorhub/Projects";

export type ProjectRefreshResult = {
  name: string;
  success: boolean;
  error?: string;
};

export async function refreshProjects(): Promise<ProjectRefreshResult[]> {
  if (os.platform() !== "linux") {
    throw new Error(
      "ConnorHub project refresh is only available on the server device.",
    );
  }

  const entries = await readdir(PROJECTS_ROOT, {
    withFileTypes: true,
  });

  const repositories: {
    name: string;
    projectPath: string;
  }[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const projectPath = path.join(PROJECTS_ROOT, entry.name);

    try {
      await execFileAsync("git", ["rev-parse", "--is-inside-work-tree"], {
        cwd: projectPath,
      });

      repositories.push({
        name: entry.name,
        projectPath,
      });
    } catch {
      // Not a Git repository.
    }
  }

  return Promise.all(
    repositories.map(async ({ name, projectPath }) => {
      try {
        await execFileAsync("git", ["fetch", "--quiet"], {
          cwd: projectPath,
          timeout: 30_000,
        });

        return {
          name,
          success: true,
        };
      } catch (error) {
        return {
          name,
          success: false,
          error: error instanceof Error ? error.message : "Git fetch failed.",
        };
      }
    }),
  );
}
