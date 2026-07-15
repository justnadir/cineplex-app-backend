import app from "./app";
import config from "./config";
import pool from "./db";
import logger from "./shared/logger";
import http from "http";

let server: http.Server | undefined;

async function main() {
  try {
    await pool.query("SELECT 1");
    logger.info("Connected to PostgreSQL");

    server = app.listen(config.port, config.ip_address, () => {
      logger.info(
        `Server is running on ${`http://${config.ip_address}:${config.port}`}`
      );
    });

    server.on("error", (err: Error) => {
      logger.error({ err }, "HTTP server error");
      process.exit(1);
    });

    server.keepAliveTimeout = 65_000;
    server.headersTimeout = 66_000;
  } catch (err) {
    logger.error({ err }, "Failed to start server");
    process.exit(1);
  }
}

// Graceful Shutdown Handler

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

let isShuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    logger.warn(`${signal} received again, shutdown already in progress`);
    return;
  }
  isShuttingDown = true;

  logger.warn(`${signal} received, starting graceful shutdown`);

  const forceExit = setTimeout(() => {
    logger.error("Force exit after 10s timeout");
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  try {
    if (server && server.listening) {
      server.closeIdleConnections?.();
      const killSwitch = setTimeout(() => {
        logger.warn("Forcing remaining connections closed");
        server?.closeAllConnections?.();
      }, 3_000);
      killSwitch.unref();

      await withTimeout(
        new Promise<void>((resolve, reject) =>
          server!.close((err) => (err ? reject(err) : resolve()))
        ),
        8_000,
        "http server close"
      );

      clearTimeout(killSwitch);
      logger.info("HTTP server closed");
    }

    await withTimeout(pool.end(), 5_000, "PostgreSQL pool close");
    logger.info("PostgreSQL pool closed");

    clearTimeout(forceExit);
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "Error during shutdown");
    process.exit(1);
  }
}

// ── Wire up signal handlers ─────────────────────────────────────────────
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

["SIGINT", "SIGTERM"].forEach((sig) => {
  process.on(sig, () => shutdown(sig));
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled Promise Rejection");
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught Exception");
  process.exit(1);
});

main();
