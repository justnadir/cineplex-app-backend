import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import requestLogger from "./middlewares/requestLogger";
import { welcome } from "./utils/welcome";
import { helmetOptions } from "./config/helmet";
import { corsOptions } from "./config/cors";
import { globalLimiter } from "./config/globalLimiter";

dotenv.config();

const app = express();

app.use(helmet(helmetOptions));
app.use(cors(corsOptions));
app.use(globalLimiter);
app.use(express.json());
app.use(requestLogger);

app.get("/", (_req: Request, res: Response) => {
  res.send(welcome());
});

export default app;
