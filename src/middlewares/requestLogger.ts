import pinoHttp from "pino-http";
import { v4 as uuidv4 } from "uuid";
import { IncomingMessage } from "http";
import logger from "../shared/logger";

const getIp = (req: IncomingMessage): string =>
  (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
  req.socket?.remoteAddress ||
  "unknown";

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
  customSuccessMessage: (req, res, responseTime) =>
    `${getIp(req)} - ${req.method} ${req.url} ${res.statusCode} - ${responseTime.toFixed(3)} ms`,
  customErrorMessage: (req, res, err) =>
    `${getIp(req)} - ${req.method} ${req.url} ${res.statusCode} - ${err.message}`,
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});

export default requestLogger;
