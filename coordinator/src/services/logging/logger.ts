import * as pino from "pino"

export function getLogger(logger: pino.LoggerOptions): pino.BaseLogger {
  return logger as unknown as pino.BaseLogger
}
