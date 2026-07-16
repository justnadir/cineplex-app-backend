import pino from "pino";
import path from "path";
import config from "../config";

const isProd = config?.app?.name === "production";
const logDir = path.join(process.cwd(), "logs");

export const logger = pino(
  {
    level: isProd ? "info" : "debug",
    base: { service: config?.app?.name || "node-pg-api" },
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
  pino.transport({
    targets: [
      ...(isProd
        ? []
        : [
            {
              target: "pino-pretty",
              level: "debug",
              options: {
                colorize: true,
                translateTime: "SYS:ddd mmm dd yyyy HH:MM:ss",
                ignore: "pid,hostname,service,req,res,responseTime",
              },
            },
          ]),
      {
        target: path.join(__dirname, "logTransport.ts"),
        options: {
          successDir: path.join(logDir, "success"),
          errorDir: path.join(logDir, "error"),
        },
      },
    ],
  })
);

export default logger;
