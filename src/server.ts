import http from "node:http";
import os from "node:os";
import "dotenv/config";

import {
  rebootServer,
  restartConnorHub,
  shutdownServer,
} from "./services/server-actions.js";

import {
  getRunningProjects,
  startProject,
  stopProject,
} from "./services/project-runner.js";

import { isAuthorized } from "./services/auth.js";

import { createBackup, listBackups } from "./services/backup.js";

import { getSystemReport } from "./services/system.js";
import { deployConnorHub } from "./services/deploy-connorhub.js";
import { getConnorHubLogs } from "./services/connorhub-logs.js";
import { getProjectStatuses } from "./services/project-status.js";
import { refreshProjects } from "./services/project-refresh.js";
import { openUrl } from "./services/open-url.js";
import { openProject } from "./services/open-project.js";
import { listProjects } from "./services/projects.js";
import { copyToClipboard } from "./services/clipboard.js";
import { sendNotification } from "./services/notification.js";
import { pullCleanProjects } from "./services/project-pull.js";

const PORT = 4242;

const server = http.createServer(async (request, response) => {
  const method = request.method;
  const url = request.url;

  async function readJsonBody(request: http.IncomingMessage): Promise<unknown> {
    const chunks: Buffer[] = [];

    for await (const chunk of request) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    if (chunks.length === 0) {
      return {};
    }

    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  }

  if (method === "POST" && url === "/api/v1/projects/pull-clean") {
    try {
      const projects = await pullCleanProjects();

      sendJson(response, 200, {
        success: projects.every((project) => project.status !== "failed"),
        projects,
      });
    } catch (error) {
      sendJson(response, 500, {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to pull projects.",
      });
    }

    return;
  }

  if (method === "GET" && url === "/api/v1/health") {
    sendJson(response, 200, {
      status: "ok",
    });

    return;
  }

  if (!isAuthorized(request.headers.authorization)) {
    sendJson(response, 401, {
      error: "Unauthorized",
    });

    return;
  }

  if (method === "POST" && url === "/api/v1/actions/backup") {
    try {
      const backup = await createBackup();

      sendJson(response, 201, {
        success: true,
        backup,
      });
    } catch (error) {
      sendJson(response, 500, {
        success: false,
        error: error instanceof Error ? error.message : "Backup failed.",
      });
    }

    return;
  }

  if (method === "GET" && url === "/api/v1/backups") {
    try {
      const backups = await listBackups();

      sendJson(response, 200, {
        success: true,
        backups,
      });
    } catch (error) {
      sendJson(response, 500, {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to list backups.",
      });
    }

    return;
  }

  if (method === "POST" && url === "/api/v1/projects/start") {
    try {
      const body = await readJsonBody(request);

      if (
        typeof body !== "object" ||
        body === null ||
        !("projectId" in body) ||
        typeof body.projectId !== "string"
      ) {
        sendJson(response, 400, {
          error: "projectId is required.",
        });

        return;
      }

      const project = await startProject(body.projectId);

      sendJson(response, 200, {
        success: true,
        project,
      });
    } catch (error) {
      sendJson(response, 500, {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Project could not be started.",
      });
    }

    return;
  }

  if (method === "POST" && url === "/api/v1/projects/stop") {
    try {
      const body = await readJsonBody(request);

      if (
        typeof body !== "object" ||
        body === null ||
        !("projectId" in body) ||
        typeof body.projectId !== "string"
      ) {
        sendJson(response, 400, {
          error: "projectId is required.",
        });

        return;
      }

      const project = stopProject(body.projectId);

      sendJson(response, 200, {
        success: true,
        project,
      });
    } catch (error) {
      sendJson(response, 500, {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Project could not be stopped.",
      });
    }

    return;
  }

  if (method === "GET" && url === "/api/v1/projects/running") {
    sendJson(response, 200, {
      projects: getRunningProjects(),
    });

    return;
  }

  if (method === "POST" && url === "/api/v1/actions/restart-connorhub") {
    try {
      await restartConnorHub();

      sendJson(response, 200, {
        success: true,
      });
    } catch (error) {
      sendJson(response, 500, {
        success: false,
        error: error instanceof Error ? error.message : "Restart failed.",
      });
    }

    return;
  }

  if (method === "POST" && url === "/api/v1/actions/reboot") {
    sendJson(response, 202, {
      success: true,
      message: "Device reboot requested.",
    });

    void rebootServer();

    return;
  }

  if (method === "POST" && url === "/api/v1/actions/shutdown") {
    sendJson(response, 202, {
      success: true,
      message: "Device shutdown requested.",
    });

    void shutdownServer();

    return;
  }

  if (method === "GET" && url === "/api/v1/projects") {
    sendJson(response, 200, {
      projects: listProjects(),
    });

    return;
  }

  if (method === "POST" && url === "/api/v1/actions/open-project") {
    try {
      const body = await readJsonBody(request);

      if (
        typeof body !== "object" ||
        body === null ||
        !("projectId" in body) ||
        typeof body.projectId !== "string"
      ) {
        sendJson(response, 400, {
          error: "projectId is required.",
        });

        return;
      }

      await openProject(body.projectId);

      sendJson(response, 200, {
        success: true,
      });
    } catch (error) {
      sendJson(response, 500, {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Project could not be opened.",
      });
    }

    return;
  }

  if (method === "POST" && url === "/api/v1/actions/open-url") {
    try {
      const body = await readJsonBody(request);

      if (
        typeof body !== "object" ||
        body === null ||
        !("url" in body) ||
        typeof body.url !== "string"
      ) {
        sendJson(response, 400, {
          error: "url is required.",
        });

        return;
      }

      await openUrl(body.url);

      sendJson(response, 200, {
        success: true,
      });
    } catch (error) {
      sendJson(response, 500, {
        success: false,
        error:
          error instanceof Error ? error.message : "URL could not be opened.",
      });
    }

    return;
  }

  if (method === "POST" && url === "/api/v1/actions/clipboard") {
    try {
      const body = await readJsonBody(request);

      if (
        typeof body !== "object" ||
        body === null ||
        !("text" in body) ||
        typeof body.text !== "string"
      ) {
        sendJson(response, 400, {
          error: "text is required.",
        });

        return;
      }

      await copyToClipboard(body.text);

      sendJson(response, 200, {
        success: true,
      });
    } catch (error) {
      sendJson(response, 500, {
        success: false,
        error:
          error instanceof Error ? error.message : "Clipboard action failed.",
      });
    }

    return;
  }

  if (method === "POST" && url === "/api/v1/actions/notify") {
    try {
      const body = await readJsonBody(request);

      if (
        typeof body !== "object" ||
        body === null ||
        !("title" in body) ||
        !("message" in body) ||
        typeof body.title !== "string" ||
        typeof body.message !== "string"
      ) {
        sendJson(response, 400, {
          error: "title and message are required.",
        });

        return;
      }

      await sendNotification(body.title, body.message);

      sendJson(response, 200, {
        success: true,
      });
    } catch (error) {
      sendJson(response, 500, {
        success: false,
        error: error instanceof Error ? error.message : "Notification failed.",
      });
    }

    return;
  }

  if (method === "POST" && url === "/api/v1/projects/refresh") {
    try {
      const projects = await refreshProjects();

      sendJson(response, 200, {
        success: projects.every((project) => project.success),
        projects,
      });
    } catch (error) {
      sendJson(response, 500, {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to refresh projects.",
      });
    }

    return;
  }

  if (method === "GET" && url === "/api/v1/projects/status") {
    try {
      const projects = await getProjectStatuses();

      sendJson(response, 200, {
        success: true,
        projects,
      });
    } catch (error) {
      sendJson(response, 500, {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to read project status.",
      });
    }

    return;
  }

  if (method === "POST" && url === "/api/v1/actions/deploy-connorhub") {
    try {
      const result = await deployConnorHub();

      sendJson(response, 200, result);
    } catch (error) {
      console.error("ConnorHub deployment failed:", error);

      sendJson(response, 500, {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "ConnorHub deployment failed.",
      });
    }

    return;
  }

  if (method === "GET" && url === "/api/v1/logs/connorhub") {
    try {
      const logs = await getConnorHubLogs();

      sendJson(response, 200, {
        success: true,
        logs,
      });
    } catch (error) {
      sendJson(response, 500, {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to retrieve ConnorHub logs.",
      });
    }

    return;
  }

  if (method === "GET" && url === "/api/v1/device") {
    sendJson(response, 200, {
      id: os.hostname().toLowerCase().replaceAll(" ", "-"),
      name: os.hostname(),
      hostname: os.hostname(),
      platform: os.platform(),
      architecture: os.arch(),
      uptimeSeconds: os.uptime(),
      cpuCount: os.cpus().length,
      totalMemoryBytes: os.totalmem(),
      agentVersion: "0.1.0",
    });

    return;
  }

  if (method === "GET" && url === "/api/v1/system") {
    sendJson(response, 200, getSystemReport());
    return;
  }

  sendJson(response, 404, {
    error: "Not found",
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`ConnorHub Agent running on port ${PORT}`);
});

function sendJson(
  response: http.ServerResponse,
  statusCode: number,
  body: unknown,
) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
  });

  response.end(JSON.stringify(body));
}
