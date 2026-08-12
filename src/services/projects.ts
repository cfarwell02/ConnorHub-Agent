import os from "node:os";
import path from "node:path";

type ProjectDefinition = {
  id: string;
  name: string;
  macPath?: string;
  windowsPath?: string;
  linuxPath?: string;
};

const PROJECTS: ProjectDefinition[] = [
  {
    id: "connorhub",
    name: "ConnorHub",
    macPath: "/Users/cfarwell/Projects/ConnorHub/dashboard",
    windowsPath: "C:\\Projects\\ConnorHub\\dashboard",
    linuxPath: "/srv/connorhub/Projects/ConnorHub/dashboard",
  },

  {
    id: "connorhub-agent",
    name: "ConnorHub Agent",
    macPath: "/Users/cfarwell/Projects/ConnorHub-Agent",
    windowsPath: "C:\\Projects\\ConnorHub-Agent",
    linuxPath: "/srv/connorhub/Projects/ConnorHub-Agent",
  },

  {
    id: "sidequest",
    name: "SideQuest",
    macPath: "/Users/cfarwell/Projects/SideQuest",
    windowsPath: "C:\\Projects\\SideQuest",
    linuxPath: "/srv/connorhub/Projects/SideQuest",
  },
];

export function getProjectPath(projectId: string): string {
  const project = PROJECTS.find((candidate) => candidate.id === projectId);

  if (!project) {
    throw new Error("Unknown project.");
  }

  let projectPath: string | undefined;

  switch (os.platform()) {
    case "darwin":
      projectPath = project.macPath;
      break;

    case "win32":
      projectPath = project.windowsPath;
      break;

    case "linux":
      projectPath = project.linuxPath;
      break;
  }

  if (!projectPath) {
    throw new Error(
      `Project ${project.name} is not configured for this device.`,
    );
  }

  return path.normalize(projectPath);
}

export function listProjects() {
  return PROJECTS.map(({ id, name }) => ({
    id,
    name,
  }));
}
