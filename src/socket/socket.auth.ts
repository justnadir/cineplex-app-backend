import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import config from "../config";

interface DecodedToken {
  userId: number;
  role: string;
}

export const socketAuthMiddleware = (
  socket: Socket,
  next: (err?: Error) => void
): void => {
  try {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error("Authentication token missing"));
    }

    const decoded = jwt.verify(token, config.jwt.accessSecret) as DecodedToken;
    socket.data.userId = decoded.userId;
    socket.data.role = decoded.role;
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
};
