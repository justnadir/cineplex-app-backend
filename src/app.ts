import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import requestLogger from "./middlewares/requestLogger";
import { welcome } from "./utils/welcome";
import { helmetOptions } from "./config/helmet";
import { corsOptions } from "./config/cors";
import { globalLimiter } from "./config/globalLimiter";
// import "./types/express.d.ts";
dotenv.config();

const app = express();

// project tech history forensics:
app.disable("x-powered-by");

// getting the real client IP behind a proxy (like Nginx or Cloudflare);
app.set("trust proxy", 1);

// Use strong ETag headers for caching, which helps with client-side caching and reduces bandwidth usage.
app.set("etag", "strong");

app.use(helmet(helmetOptions));
app.use(cors(corsOptions));
app.use(globalLimiter);
app.use(express.json());
app.use(requestLogger);
app.use(cookieParser());

app.get("/", (_req: Request, res: Response) => {
  res.send(welcome());
});

export default app;
