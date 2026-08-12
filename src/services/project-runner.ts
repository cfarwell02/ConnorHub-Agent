import { spawn, type ChildProcess } from "node:child_process";
import { access } from "node:fs/promises";
import os from "node:os";

import { getProjectDefinition, getProjectPath } from "./projects.js";

type RunningProject = {
  process: ChildProcess;
  startedAt: string;
};

const runningProjects = new Map<string, RunningProject>();

export type RunningProjectStatus = {
  projectId: string;
  running: boolean;
  pid: number | null;
  startedAt: string | null;
};

export async function startProject(
  projectId: string,
): Promise<RunningProjectStatus> {
  requireServerDevice();
  const existing = runningProjects.get(projectId);

  if (
    existing &&
    existing.process.exitCode === null &&
    !existing.process.killed
  ) {
    return createStatus(projectId, existing);
  }

  const project = getProjectDefinition(projectId);

  if (!project.devCommand) {
    throw new Error(
      `${project.name} does not have a configured development command.`,
    );
  }

  const projectPath = getProjectPath(projectId);

  await access(projectPath);

  const child = spawn(project.devCommand.command, project.devCommand.args, {
    cwd: projectPath,
    stdio: "ignore",
    detached: false,
  });

  const runningProject: RunningProject = {
    process: child,
    startedAt: new Date().toISOString(),
  };

  runningProjects.set(projectId, runningProject);

  child.once("exit", () => {
    const current = runningProjects.get(projectId);

    if (current?.process === child) {
      runningProjects.delete(projectId);
    }
  });

  child.once("error", () => {
    const current = runningProjects.get(projectId);

    if (current?.process === child) {
      runningProjects.delete(projectId);
    }
  });

  return createStatus(projectId, runningProject);
}

export function stopProject(projectId: string): RunningProjectStatus {
  requireServerDevice();
  const running = runningProjects.get(projectId);

  if (!running) {
    return {
      projectId,
      running: false,
      pid: null,
      startedAt: null,
    };
  }

  running.process.kill("SIGTERM");
  runningProjects.delete(projectId);

  return {
    projectId,
    running: false,
    pid: null,
    startedAt: null,
  };
}

export function getRunningProjects(): RunningProjectStatus[] {
  requireServerDevice();
  return Array.from(runningProjects.entries()).map(([projectId, running]) =>
    createStatus(projectId, running),
  );
}

function createStatus(
  projectId: string,
  running: RunningProject,
): RunningProjectStatus {
  return {
    projectId,
    running: running.process.exitCode === null && !running.process.killed,
    pid: running.process.pid ?? null,
    startedAt: running.startedAt,
  };
}

function requireServerDevice(): void {
  if (os.platform() !== "linux") {
    throw new Error(
      "Project runner actions are only supported on the ConnorHub server.",
    );
  }
}
