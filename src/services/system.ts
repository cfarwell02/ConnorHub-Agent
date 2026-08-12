import os from "node:os";

export type SystemReport = {
  hostname: string;
  platform: NodeJS.Platform;
  architecture: string;
  uptimeSeconds: number;
  cpu: {
    model: string;
    logicalCores: number;
  };
  memory: {
    totalBytes: number;
    freeBytes: number;
    usedBytes: number;
  };
};

export function getSystemReport(): SystemReport {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const cpus = os.cpus();

  return {
    hostname: os.hostname(),
    platform: os.platform(),
    architecture: os.arch(),
    uptimeSeconds: os.uptime(),
    cpu: {
      model: cpus[0]?.model ?? "Unknown",
      logicalCores: cpus.length,
    },
    memory: {
      totalBytes: totalMemory,
      freeBytes: freeMemory,
      usedBytes: totalMemory - freeMemory,
    },
  };
}
