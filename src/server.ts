import http from "node:http";
import os from "node:os";
import { getSystemReport } from "./services/system.js";
import { deployConnorHub } from "./services/deploy-connorhub.js";
import { getConnorHubLogs } from "./services/connorhub-logs.js";

const PORT = 4242;

const server = http.createServer(async (request, response) => {
  const method = request.method;
  const url = request.url;

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

  if (method === "GET" && url === "/api/v1/health") {
    sendJson(response, 200, {
      status: "ok",
    });

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
