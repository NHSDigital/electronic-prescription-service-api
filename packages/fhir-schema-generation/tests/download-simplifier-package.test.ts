import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import * as tar from "tar"
import {
  describe,
  expect,
  it,
  vi,
  afterEach,
  Mock
} from "vitest"
import {downloadSimplifierPackage, extractAndReadPackage} from "../src/utils/download-simplifier-package.js"

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "fhir-schema-test-"))
}

vi.mock("tar")

afterEach(() => {
  vi.restoreAllMocks()
})

describe("download-simplifier-package", () => {
  it("throws when version is not provided", async () => {
    vi.stubGlobal("fetch", vi.fn());

    (fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({data: "success"})
    })

    await expect(downloadSimplifierPackage("https://reg", "pkg", "/out", undefined))
      .rejects.toThrow("Cannot find valid version in metadata")
  })

  it("throws when version is empty", async () => {
    vi.stubGlobal("fetch", vi.fn());

    (fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({data: "success"})
    })

    await expect(downloadSimplifierPackage("https://reg", "pkg", "/out", ""))
      .rejects.toThrow("Cannot find valid version in metadata")
  })

  it("throws when version doesn't exist", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      "dist-tags": {latest: "1.0.0"},
      versions: {"1.0.0": {version: "1.0.0", dist: {}}}
    }))))

    await expect(downloadSimplifierPackage("https://reg", "pkg", "/out", "a"))
      .rejects.toThrow("Version a not found in registry")
  })

  it("skips download if already exists locally", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fhir-test-"))
    const targetFile = path.join(tmpDir, "pkg-1.0.0.tgz")
    fs.writeFileSync(targetFile, "dummy content")

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        "dist-tags": {latest: "1.0.0"},
        versions: {"1.0.0": {version: "1.0.0", dist: {}}}
      })
    }))

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

    await downloadSimplifierPackage("https://reg", "pkg", tmpDir, "latest")

    expect(consoleSpy).toHaveBeenCalledWith('File "pkg-1.0.0.tgz" already exists locally. Skipping download.')
  })

  it("creates output directory if it does not exist during download", async () => {
    const tmp = makeTempDir()
    const outputDir = path.join(tmp, "non-existent-folder")

    vi.stubGlobal("fetch", vi.fn(async () => {
      return new Response(JSON.stringify({
        "dist-tags": {latest: "1.0.0"},
        versions: {"1.0.0": {version: "1.0.0", dist: {tarball: "https://test/pkg.tgz"}}}
      }), {status: 200})
    }))

    await expect(
      downloadSimplifierPackage("https://test", "my-package", outputDir, "latest")
    ).rejects.toThrow("Could not find expected 'package/package.json'")

    expect(fs.existsSync(outputDir)).toBe(true)
  })

  it("throws when tarball URL is missing or empty in metadata", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      return new Response(JSON.stringify({
        "dist-tags": {latest: "1.0.0"},
        versions: {"1.0.0": {version: "1.0.0", dist: {tarball: " "}}} // Empty string
      }), {status: 200})
    }))

    const tmp = makeTempDir()
    await expect(downloadSimplifierPackage("https://test", "my-package", tmp, "latest"))
      .rejects.toThrow("Failed to find valid URL for Tarball")
  })

  it("triggers directory creation in extractAndReadPackage", async () => {
    const tmp = makeTempDir()
    const source = path.join(tmp, "dummy.tgz")
    const target = path.join(tmp, "deep/nested/target")
    fs.writeFileSync(source, "not a real tarball")

    await expect(extractAndReadPackage(source, target)).rejects.toThrow()
    expect(fs.existsSync(target)).toBe(true)
  })

  it("throws if metadata fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ok: false, statusText: "Not Found"}))
    await expect(downloadSimplifierPackage("https://reg", "pkg", "/dir", "latest"))
      .rejects.toThrow("Failed to fetch metadata: Not Found")
  })

  it("throws if target version is missing from metadata", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        "dist-tags": {latest: "2.0.0"},
        versions: {"1.0.0": {version: "1.0.0"}} // 2.0.0 is missing
      })
    }))
    await expect(downloadSimplifierPackage("https://reg", "pkg", "/dir", "latest"))
      .rejects.toThrow("Version 2.0.0 not found in registry")
  })

  it("throws if tarball download request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async (url) => {
      if (url.endsWith("pkg")) return {
        ok: true,
        json: async () => ({
          "dist-tags": {latest: "1.0.0"},
          versions: {"1.0.0": {version: "1.0.0", dist: {tarball: "https://reg/tarball.tgz"}}}
        })
      }
      return {ok: false, statusText: "Forbidden"} // Fails on tarball fetch
    }))

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fhir-test-"))
    await expect(downloadSimplifierPackage("https://reg", "pkg", tmpDir, "latest"))
      .rejects.toThrow("Failed to download tarball: Forbidden")
  })

  it("throws if extracted tarball is missing package.json", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fhir-test-"))
    const emptyDir = path.join(tmpDir, "empty")
    fs.mkdirSync(emptyDir)

    // Create an empty tarball
    const tarballPath = path.join(tmpDir, "dummy.tgz")
    await tar.create({gzip: true, file: tarballPath, cwd: tmpDir}, ["empty"])

    const outputDir = path.join(tmpDir, "out")
    await expect(extractAndReadPackage(tarballPath, outputDir))
      .rejects.toThrow("Could not find expected 'package/package.json' inside")
  })

  it("logs a warning when a non-latest version is requested", async () => {
    const tmpDir = makeTempDir()

    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      "dist-tags": {latest: "2.0.0"},
      versions: {
        "1.0.0": {version: "1.0.0", dist: {tarball: "http://test.com/1.0.0.tgz"}},
        "2.0.0": {version: "2.0.0", dist: {tarball: "http://test.com/2.0.0.tgz"}}
      }
    }))))

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

    // Pass tmpDir instead of "/out"
    // We can also catch any errors if we don't want to fully mock the tarball extraction
    await downloadSimplifierPackage("https://reg", "pkg", tmpDir, "1.0.0").catch(() => {})

    expect(warnSpy).toHaveBeenCalledWith(
      "A later version of this package is available",
      "2.0.0"
    )
  })

  it("throws an error if the tarball response body is empty", async () => {
    const tmpDir = makeTempDir()

    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ // Metadata call
        ok: true,
        json: async () => ({
          "dist-tags": {latest: "1.0.0"},
          versions: {"1.0.0": {version: "1.0.0", dist: {tarball: "http://test.tgz"}}}
        })
      })
      .mockResolvedValueOnce({ // Tarball call
        ok: true,
        body: null, // This triggers line 85
        statusText: "No Body"
      })
    )

    // Pass tmpDir as the output directory
    await expect(downloadSimplifierPackage("https://reg", "pkg", tmpDir, "latest"))
      .rejects.toThrow("Failed to download tarball: No Body")
  })

  it("filters files during extraction to ensure they stay within target directory", async () => {
    const tmp = makeTempDir()
    const source = path.join(tmp, "dummy.tgz")
    const target = path.join(tmp, "out")
    fs.writeFileSync(source, "fake tar content")

    // Trigger the function to capture the filter predicate passed to tar.x
    await extractAndReadPackage(source, target).catch(() => {})

    const tarMock = vi.mocked(tar.x)
    const filterFunc = tarMock.mock.calls[0][0].filter

    // tar's filter function expects (path: string, entry: any)
    const mockEntry = {} as any

    // Test line 99: Valid path within the resolved target
    expect(filterFunc!("package/index.js", mockEntry)).toBe(true)

    // Test line 99: Potential path traversal (should return false)
    expect(filterFunc!("../traversal.js", mockEntry)).toBe(false)
  })
})
