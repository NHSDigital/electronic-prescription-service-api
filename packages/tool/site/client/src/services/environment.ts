export type Environment = "internal-dev" | "internal-dev-sandbox" | "internal-qa" | "int" | "sandbox"

export const internalDev = "internal-dev"
export const internalDevSandbox = "internal-dev-sandbox"
export const internalQa = "internal-qa"
export const int = "int"
export const sandbox = "sandbox"

export function isInternalDev(environment: Environment): boolean {
  return environment === internalDev
}

export function isQa(environment: Environment): boolean {
  return environment === internalQa
}

export function isInt(environment: Environment): boolean {
  return environment === int
}

export function isSandbox(environment: Environment): boolean {
  return environment === sandbox
}

export function isInternalDevSandbox(environment: Environment): boolean {
  return environment === internalDevSandbox
}
