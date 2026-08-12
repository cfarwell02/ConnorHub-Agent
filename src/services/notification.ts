import { execFile } from "node:child_process";
import os from "node:os";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function sendNotification(
  title: string,
  message: string,
): Promise<void> {
  if (!title.trim() || !message.trim()) {
    throw new Error("Title and message are required.");
  }

  if (title.length > 100 || message.length > 500) {
    throw new Error("Notification content is too long.");
  }

  switch (os.platform()) {
    case "darwin":
      await execFileAsync("osascript", [
        "-e",
        `display notification ${quoteAppleScript(
          message,
        )} with title ${quoteAppleScript(title)}`,
      ]);

      return;

    case "win32":
      await execFileAsync(
        "powershell.exe",
        [
          "-NoProfile",
          "-Command",
          `
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.MessageBox]::Show(
  $env:CONNORHUB_MESSAGE,
  $env:CONNORHUB_TITLE
)
`,
        ],
        {
          env: {
            ...process.env,
            CONNORHUB_TITLE: title,
            CONNORHUB_MESSAGE: message,
          },
          windowsHide: true,
        },
      );

      return;

    default:
      throw new Error("Notifications are not configured on this device.");
  }
}

function quoteAppleScript(value: string): string {
  return JSON.stringify(value);
}
