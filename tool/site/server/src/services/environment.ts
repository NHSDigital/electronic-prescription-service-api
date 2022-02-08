import {CONFIG} from "../config"

export function isLocal(): boolean {
  return CONFIG.environment.endsWith("-sandbox") ?? false
}

export function isDev(): boolean {
  return CONFIG.environment === "internal-dev"
}
