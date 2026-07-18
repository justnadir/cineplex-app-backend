// socket/socket.types.ts
export interface ServerToClientEvents {
  "order:statusUpdated": (data: {
    orderId: number;
    status: string;
    updatedAt: string;
  }) => void;
}

export interface ClientToServerEvents {
  "order:track": (orderId: number) => void;
  "order:untrack": (orderId: number) => void;
}
