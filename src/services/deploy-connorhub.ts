import { execFile } from "node:child_process";
import os from "node:os";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const CONNORHUB_DIRECTORY =
  process.env.CONNORHUB_DIRECTORY ??
  "/srv/connorhub/Projects/ConnorHub/dashboard";

export type DeployResult = {
  success: boolean;
  steps: {
    name: string;
    output: string;
  }[];
};

export async function deployConnorHub(): Promise<DeployResult> {
  if (os.platform() !== "linux") {
    throw new Error(
      "ConnorHub deployment is only supported on the server device.",
    );
  }

  const steps: DeployResult["steps"] = [];

  const pullResult = await execFileAsync("git", ["pull"], {
    cwd: CONNORHUB_DIRECTORY,
  });

  steps.push({
    name: "Git pull",
    output: pullResult.stdout.trim(),
  });

  const buildResult = await execFileAsync("npm", ["run", "build"], {
    cwd: CONNORHUB_DIRECTORY,
  });

  steps.push({
    name: "Build",
    output: buildResult.stdout.trim(),
  });

  const restartResult = await execFileAsync(
    "sudo",
    ["systemctl", "restart", "connorhub"],
    {
      cwd: CONNORHUB_DIRECTORY,
    },
  );

  steps.push({
    name: "Restart",
    output: restartResult.stdout.trim() || "ConnorHub restarted.",
  });

  return {
    success: true,
    steps,
  };
}
