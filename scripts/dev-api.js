import { createServer } from "node:http";
import { Readable } from "node:stream";
import audit from "../api/audit/analyze.js";

// Local-only adapter for the same Web Standard handler used by Vercel.
createServer(async (req, res) => {
  try {
    if (req.url?.split("?")[0] !== "/api/audit/analyze") {
      res.writeHead(404);
      res.end();
      return;
    }
    const request = new Request(`http://127.0.0.1:3001${req.url}`, {
      method: req.method,
      headers: req.headers,
      ...(!["GET", "HEAD"].includes(req.method)
        ? { body: Readable.toWeb(req), duplex: "half" }
        : {}),
    });
    const response = await audit.fetch(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end('{"error":{"code":"UNAVAILABLE"}}');
  }
}).listen(3001, "127.0.0.1", () =>
  console.info("Local Audit API: http://127.0.0.1:3001"),
);
