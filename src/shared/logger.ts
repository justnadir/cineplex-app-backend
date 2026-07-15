import pino from "pino";
import pretty from "pino-pretty";
import config from "../config";

const isProd = config.app.name === "production";

const prettyStream = pretty({
  colorize: true,
  translateTime: "SYS:ddd mmm dd yyyy HH:MM:ss",
  ignore: "pid,hostname,service,req,res,responseTime",
  customPrettifiers: {
    time: (timestamp) => `${timestamp} [CINEPLEX]`,
  },
});

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || (isProd ? "info" : "debug"),
    base: { service: config.app.name || "node-pg-api" },
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
  },
  isProd ? undefined : prettyStream
);

export default logger;
