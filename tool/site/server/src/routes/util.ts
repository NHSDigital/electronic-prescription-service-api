export function getUtcEpochSeconds(date: Date): number {
  return (date.getTime() + date.getTimezoneOffset() * 60 * 1000) / 1000
}
