export interface MockVersionEntry {
  version: string
  dist: Record<string, string>
  url: string
}

export function buildMockMetadata(
  latest: string,
  versions: Record<string, MockVersionEntry>
) {
  return {"dist-tags": {latest}, versions}
}

export function buildVersionEntry(version: string, tarball = "https://tarball.url"): MockVersionEntry {
  return {version, dist: {tarball}, url: ""}
}
