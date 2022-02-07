export type Environment = "internal-dev" | "internal-dev-sandbox" | "internal-qa" | "int"

export const internalDev = "internal-dev"
export const internalDevSandbox = "internal-dev-sandbox"
export const int = "int"

export function isDev(environment: Environment): boolean {
  return environment === internalDev || environment === internalDevSandbox
}

export function isInt(environment: Environment): boolean {
  return environment === int
}
