import http from "node:http";
import os from "node:os";
import { getSystemReport } from "./services/system.js";

const PORT = 4242;

const server = http.createServer((request, response) => {
  const method = request.method;
  const url = request.url;

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
