import logger from "../shared/logger";
import "../shared/queue/manifest"; // eituku e sob worker (email, order, notification) start kore dey

logger.info("All workers started");

process.on("SIGTERM", () => {
  logger.warn("SIGTERM received, shutting down workers...");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.warn("SIGINT received, shutting down workers...");
  process.exit(0);
});
