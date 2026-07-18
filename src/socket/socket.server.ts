import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { redisClient } from "../config/redis";
import { socketAuthMiddleware } from "./socket.auth";
import logger from "../shared/logger";

let io: Server | undefined;
let pubClient: ReturnType<typeof redisClient.duplicate>;
let subClient: ReturnType<typeof redisClient.duplicate>;

let activeConnections = 0;
let statsInterval: ReturnType<typeof setInterval> | undefined;

export const initSocketServer = async (
  httpServer: HttpServer
): Promise<Server> => {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
  });

  pubClient = redisClient.duplicate();
  subClient = redisClient.duplicate();

  pubClient.on("error", (err) =>
    logger.error({ err }, "Socket.io Redis pubClient error")
  );
  subClient.on("error", (err) =>
    logger.error({ err }, "Socket.io Redis subClient error")
  );

  await Promise.all([
    new Promise<void>((resolve) => pubClient.once("ready", resolve)),
    new Promise<void>((resolve) => subClient.once("ready", resolve)),
  ]);

  io.adapter(createAdapter(pubClient, subClient));

  logger.info("Socket.io: connected (Redis adapter attached)");

  io.use(socketAuthMiddleware);

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as number;
    socket.join(`user:${userId}`);

    activeConnections++;

    logger.debug(`Socket connected: ${socket.id}, user: ${userId}`);

    socket.on("disconnect", (reason) => {
      activeConnections--;
      logger.debug(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    });
  });

  statsInterval = setInterval(() => {
    logger.info(`Active socket connections: ${activeConnections}`);
  }, 60_000);
  statsInterval.unref();

  return io;
};

// service layer accessor
export const getIO = (): Server => {
  if (!io) throw new Error("Socket.io has not been initialized");
  return io;
};

// graceful shutdown
export const closeSocketServer = async (): Promise<void> => {
  if (statsInterval) clearInterval(statsInterval);

  if (io) {
    await new Promise<void>((resolve) => io!.close(() => resolve()));
    logger.info("Socket.io: server closed");
  }

  await pubClient?.quit();
  await subClient?.quit();
  logger.info("Socket.io: Redis pub/sub connections closed");
};
