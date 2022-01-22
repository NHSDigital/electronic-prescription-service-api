export type Environment = "internal-dev" | "int"

export const internalDev = "internal-dev"
export const int = "int"

export function isDev(environment: Environment) {
  return environment === internalDev
}

export function isInt(environment: Environment) {
  return environment === int
}