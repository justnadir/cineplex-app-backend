import { Response } from "express";
import { IPagination } from "../types/pagination";

interface IApiResponse<T> {
  statusCode: number;
  success: boolean;
  message?: string;
  meta?: IPagination;
  data?: T;
}

const sendResponse = <T>(res: Response, payload: IApiResponse<T>): void => {
  const body = {
    success: payload.success,
    message: payload.message ?? null,
    meta: payload.meta,
    data: payload.data ?? null,
  };
  res.status(payload.statusCode).json(body);
};

export default sendResponse;
