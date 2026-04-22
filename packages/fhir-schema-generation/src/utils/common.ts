export function normalizeFileName(fileName: string): string {
  return fileName.replaceAll("/", "-")
}
