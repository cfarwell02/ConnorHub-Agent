type ProjectDefinition = {
  id: string;
  name: string;
  serverPath: string;
  workspacePaths?: {
    darwin?: string;
    win32?: string;
  };
  devCommand?: {
    command: string;
    args: string[];
  };
};

const PROJECTS: ProjectDefinition[] = [
  {
    id: "sidequest",
    name: "SideQuest",
    serverPath: "/srv/connorhub/Projects/SideQuest",
    workspacePaths: {
      darwin: "/Volumes/ConnorHub/Projects/SideQuest",
      win32: "Z:\\Projects\\SideQuest",
    },
    devCommand: {
      command: "npm",
      args: ["run", "dev"],
    },
  },
  {
    id: "connorhub-agent",
    name: "ConnorHub Agent",
    serverPath: "/srv/connorhub/Projects/ConnorHub-Agent",
    devCommand: {
      command: "npm",
      args: ["run", "dev"],
    },
  },
  {
    id: "sidequest",
    name: "SideQuest",
    serverPath: "/srv/connorhub/Projects/SideQuest",
    devCommand: {
      command: "npm",
      args: ["run", "dev"],
    },
  },
];

export function getProjectDefinition(projectId: string): ProjectDefinition {
  const project = PROJECTS.find((candidate) => candidate.id === projectId);

  if (!project) {
    throw new Error("Unknown project.");
  }

  return project;
}

export function getProjectPath(projectId: string): string {
  return getProjectDefinition(projectId).serverPath;
}

export function listProjects() {
  return PROJECTS.map(({ id, name }) => ({
    id,
    name,
  }));
}

export function getServerProjectPath(projectId: string): string {
  return getProjectDefinition(projectId).serverPath;
}

export function getWorkspaceProjectPath(projectId: string): string {
  const project = getProjectDefinition(projectId);

  const platform = process.platform;

  const workspacePath =
    platform === "darwin"
      ? project.workspacePaths?.darwin
      : platform === "win32"
        ? project.workspacePaths?.win32
        : undefined;

  if (!workspacePath) {
    throw new Error(
      `${project.name} does not have a workspace path configured for this device.`,
    );
  }

  return workspacePath;
}
