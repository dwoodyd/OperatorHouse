import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
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
 *
 * Video seeking support:
 * Range headers are forwarded to the upstream presigned URL so browsers
 * can seek within videos without re-downloading the full file.
 * Accept-Ranges: bytes is always set so browsers know seeking is supported.
 */

/** Infer MIME type from file extension as a fallback */
function inferContentType(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "mp4":  return "video/mp4";
    case "webm": return "video/webm";
    case "mov":  return "video/quicktime";
    case "png":  return "image/png";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "webp": return "image/webp";
    case "gif":  return "image/gif";
    case "svg":  return "image/svg+xml";
    case "pdf":  return "application/pdf";
    default:     return "application/octet-stream";
  }
}

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
      const reqHeaders: Record<string, string> = {};
      if (req.headers.range) {
        reqHeaders["Range"] = req.headers.range;
      }

      // Step 3: fetch the actual file from the presigned URL
      const fileResp = await fetch(url, { headers: reqHeaders });
      if (!fileResp.ok && fileResp.status !== 206) {
        console.error(`[StorageProxy] file fetch error: ${fileResp.status} for key=${key}`);
        res.status(fileResp.status).send("File not found");
        return;
      }

      // Step 4: set response headers
      // Content-Type: use upstream value if present, otherwise infer from extension
      const upstreamContentType = fileResp.headers.get("content-type");
      const contentType =
        upstreamContentType && !upstreamContentType.startsWith("application/octet-stream")
          ? upstreamContentType
          : inferContentType(key);
      res.setHeader("Content-Type", contentType);

      // Always advertise byte-range support so browsers can seek in videos
      res.setHeader("Accept-Ranges", "bytes");

      const contentLength = fileResp.headers.get("content-length");
      const contentRange = fileResp.headers.get("content-range");
      const lastModified = fileResp.headers.get("last-modified");
      if (contentLength) res.setHeader("Content-Length", contentLength);
      if (contentRange) res.setHeader("Content-Range", contentRange);
      if (lastModified) res.setHeader("Last-Modified", lastModified);

      // Cache for 55 minutes (just under the 60-minute presigned URL TTL)
      res.setHeader("Cache-Control", "public, max-age=3300");
      res.status(fileResp.status);

      // Step 5: stream the body using Node.js pipeline for reliability
      if (fileResp.body) {
        try {
          const nodeStream = Readable.fromWeb(fileResp.body as import("stream/web").ReadableStream);
          await pipeline(nodeStream, res);
        } catch (streamErr: unknown) {
          // Client disconnected mid-stream — not an error worth logging loudly
          const msg = streamErr instanceof Error ? streamErr.message : String(streamErr);
          if (!msg.includes("ERR_STREAM_DESTROYED") && !msg.includes("aborted")) {
            console.error("[StorageProxy] stream error:", streamErr);
          }
          if (!res.writableEnded) res.end();
        }
      } else {
        res.end();
      }
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      if (!res.headersSent) res.status(502).send("Storage proxy error");
    }
  });
}
