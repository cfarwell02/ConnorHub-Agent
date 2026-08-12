import { execFile } from "node:child_process";
import { access } from "node:fs/promises";
import os from "node:os";
import { promisify } from "node:util";

import { getProjectPath } from "./projects.js";

const execFileAsync = promisify(execFile);

export async function openProject(projectId: string): Promise<void> {
  const projectPath = getProjectPath(projectId);

  await access(projectPath);

  switch (os.platform()) {
    case "darwin":
    case "linux":
      await execFileAsync("code", [projectPath]);
      return;

    case "win32":
      await execFileAsync("cmd", ["/c", "code", projectPath], {
        windowsHide: true,
      });
      return;

    default:
      throw new Error("Opening projects is unsupported on this device.");
  }
}
