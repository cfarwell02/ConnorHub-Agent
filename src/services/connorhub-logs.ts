import { execFile } from "node:child_process";
import os from "node:os";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function getConnorHubLogs(): Promise<string> {
  if (os.platform() !== "linux") {
    throw new Error(
      "ConnorHub service logs are only available on the server device.",
    );
  }

  const { stdout } = await execFileAsync("journalctl", [
    "-u",
    "connorhub.service",
    "-n",
    "100",
    "--no-pager",
  ]);

  return stdout.trim();
}
