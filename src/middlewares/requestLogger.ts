import pinoHttp from "pino-http";
import { v4 as uuidv4 } from "uuid";
import { IncomingMessage } from "http";
import logger from "../shared/logger";

export const requestLogger = pinoHttp({
  logger,
  genReqId: (req: IncomingMessage) => {
    const existing = req.headers["x-request-id"];
    if (typeof existing === "string" && existing.length) return existing;
    return uuidv4();
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  customSuccessMessage: (req, res) =>
    `${req.method} ${req.url} ${res.statusCode}`,
  customErrorMessage: (req, res, err) =>
    `${req.method} ${req.url} ${res.statusCode} - ${err.message}`,
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});

export default requestLogger;
