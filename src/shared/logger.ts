import pino from "pino";
import config from "../config";

const isProd = config.node_env === "production";

export const logger = pino({
  level: isProd ? "info" : "debug",
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.token",
    ],
    censor: "[REDACTED]",
  },
  transport: isProd
    ? undefined
    : {
      target: "pino-pretty",
      options: {
        colorize: true,
        singleLine: true,
        translateTime: "HH:MM:ss",
      },
    },
});

export default logger;
