export function isLocal(): boolean {
  return process.env.ENVIRONMENT?.endsWith("-sandbox") ?? false
}

export function isDev(): boolean {
  return process.env.ENVIRONMENT === "internal-dev"
}
