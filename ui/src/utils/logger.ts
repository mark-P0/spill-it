import pino from "pino";
import { env } from "./env";

export const logger = pino({
  level: env.VITE_PINO_LEVEL,
});
