export type Environment = "internal-dev" | "internal-dev-sandbox" | "internal-qa" | "int"

export const internalDev = "internal-dev"
export const internalDevSandbox = "internal-dev-sandbox"
export const int = "int"
export const qa = "internal-qa"

export function isLocal(environment: Environment): boolean {
  return environment === internalDevSandbox
}

export function isDev(environment: Environment): boolean {
  return environment === internalDev
}

export function isInt(environment: Environment): boolean {
  return environment === int
}

export function isQa(environment: Environment): boolean {
  return environment === qa
}
