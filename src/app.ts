import express, { Request, Response } from "express";
import dotenv from "dotenv";
import requestLogger from "./middlewares/requestLogger";
import { welcome } from "./utils/welcome";

dotenv.config();

const app = express();

app.use(express.json());
app.use(requestLogger);

app.get("/", (_req: Request, res: Response) => {
  res.send(welcome());
});

export default app;
