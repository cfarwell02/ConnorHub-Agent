type ProjectDefinition = {
  id: string;
  name: string;
  serverPath: string;
  devCommand?: {
    command: string;
    args: string[];
  };
};

const PROJECTS: ProjectDefinition[] = [
  {
    id: "connorhub",
    name: "ConnorHub",
    serverPath: "/srv/connorhub/Projects/ConnorHub/dashboard",
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
