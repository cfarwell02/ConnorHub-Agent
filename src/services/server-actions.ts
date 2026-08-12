import { execFile } from "node:child_process";
import os from "node:os";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function requireLinuxServer() {
  if (os.platform() !== "linux") {
    throw new Error("This action is only supported on the ConnorHub server.");
  }
}

export async function restartConnorHub(): Promise<void> {
  requireLinuxServer();

  await execFileAsync("sudo", [
    "-n",
    "systemctl",
    "restart",
    "connorhub.service",
  ]);
}

export async function rebootServer(): Promise<void> {
  requireLinuxServer();

  await execFileAsync("sudo", ["-n", "systemctl", "reboot"]);
}

export async function shutdownServer(): Promise<void> {
  requireLinuxServer();

  await execFileAsync("sudo", ["-n", "systemctl", "poweroff"]);
}
