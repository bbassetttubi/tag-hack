import pino from "pino";
import { config } from "../config";

const logger = pino({
  level: config.logLevel,
  transport: config.nodeEnv === "development" ? { target: "pino-pretty" } : undefined,
  base: { service: config.observabilityServiceName },
});

export { logger };

