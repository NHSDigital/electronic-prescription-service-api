export function isLocal(): boolean {
  return process.env.ENVIRONMENT?.endsWith("-sandbox") ?? false
}
