export function hasCorrectISOFormat(timestamp: string): boolean {
  const ISOTimestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+\d{2}:\d{2}$/
  return ISOTimestampRegex.test(timestamp)
}
