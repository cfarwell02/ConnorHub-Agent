import { execFile } from "node:child_process";
import os from "node:os";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function openUrl(url: string): Promise<void> {
  const parsedUrl = new URL(url);

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS URLs are supported.");
  }

  switch (os.platform()) {
    case "darwin":
      await execFileAsync("open", [url]);
      return;

    case "win32":
      await execFileAsync("cmd", ["/c", "start", "", url], {
        windowsHide: true,
      });
      return;

    case "linux":
      await execFileAsync("xdg-open", [url]);
      return;

    default:
      throw new Error("Opening URLs is unsupported on this device.");
  }
}
