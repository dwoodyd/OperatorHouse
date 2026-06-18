import type { Express } from "express";
import { ENV } from "./env";

/**
 * Storage proxy — streams file bytes directly to the client instead of
 * issuing a 307 redirect to a presigned URL.
 *
 * Why stream instead of redirect?
 * Presigned CloudFront URLs expire after ~60 minutes. Browsers cache 307
 * redirects and reuse the cached presigned URL on subsequent requests,
 * which returns a 403 after expiry. Streaming the bytes through this proxy
 * means the browser always sees a stable /manus-storage/<key> URL that
 * never expires.
 */
export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      // Step 1: get a fresh presigned URL from the Forge API
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      // Step 2: forward Range header if present (needed for video seeking)
      const headers: Record<string, string> = {};
      if (req.headers.range) {
        headers["Range"] = req.headers.range;
      }

      // Step 3: fetch the actual file from the presigned URL
      const fileResp = await fetch(url, { headers });
      if (!fileResp.ok && fileResp.status !== 206) {
        console.error(`[StorageProxy] file fetch error: ${fileResp.status} for key=${key}`);
        res.status(fileResp.status).send("File not found");
        return;
      }

      // Step 4: forward relevant response headers to the client
      const contentType = fileResp.headers.get("content-type");
      const contentLength = fileResp.headers.get("content-length");
      const contentRange = fileResp.headers.get("content-range");
      const acceptRanges = fileResp.headers.get("accept-ranges");
      const lastModified = fileResp.headers.get("last-modified");

      if (contentType) res.setHeader("Content-Type", contentType);
      if (contentLength) res.setHeader("Content-Length", contentLength);
      if (contentRange) res.setHeader("Content-Range", contentRange);
      if (acceptRanges) res.setHeader("Accept-Ranges", acceptRanges);
      if (lastModified) res.setHeader("Last-Modified", lastModified);

      // Cache for 55 minutes (just under the 60-minute presigned URL TTL)
      res.setHeader("Cache-Control", "public, max-age=3300");
      res.status(fileResp.status);

      // Step 5: stream the body
      if (fileResp.body) {
        const reader = fileResp.body.getReader();
        const pump = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!res.writableEnded) res.write(value);
          }
          if (!res.writableEnded) res.end();
        };
        pump().catch((err) => {
          console.error("[StorageProxy] stream error:", err);
          if (!res.writableEnded) res.end();
        });
      } else {
        res.end();
      }
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      if (!res.headersSent) res.status(502).send("Storage proxy error");
    }
  });
}
