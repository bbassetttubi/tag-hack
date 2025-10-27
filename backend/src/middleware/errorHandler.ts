import { ErrorRequestHandler } from "express";
import { logger } from "../utils/logger";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = err.status ?? 500;
  const message = err.message ?? "Internal Server Error";

  logger.error({ err, status }, "Request failed");

  res.status(status).json({
    error: {
      message,
      status,
    },
  });
};

