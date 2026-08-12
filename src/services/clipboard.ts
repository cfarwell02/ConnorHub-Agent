import { spawn } from "node:child_process";
import os from "node:os";

export async function copyToClipboard(text: string): Promise<void> {
  if (text.length > 100_000) {
    throw new Error("Clipboard text is too large.");
  }

  switch (os.platform()) {
    case "darwin":
      await pipeText("pbcopy", [], text);
      return;

    case "win32":
      await pipeText(
        "powershell.exe",
        [
          "-NoProfile",
          "-Command",
          "Set-Clipboard -Value ([Console]::In.ReadToEnd())",
        ],
        text,
      );
      return;

    case "linux":
      throw new Error(
        "Clipboard actions are not configured on this Linux device.",
      );

    default:
      throw new Error("Clipboard is unsupported on this device.");
  }
}

function pipeText(
  command: string,
  args: string[],
  text: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["pipe", "ignore", "pipe"],
    });

    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.once("error", reject);

    child.once("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr || `${command} exited with code ${code}.`));
    });

    child.stdin.end(text);
  });
}
