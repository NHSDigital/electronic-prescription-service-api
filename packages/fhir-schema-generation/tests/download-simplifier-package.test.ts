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

    await expect(downloadSimplifierPackage("http://reg", "pkg", "/out", undefined))
      .rejects.toThrow("Cannot find valid version in metadata")
  })

  it("throws when version is empty", async () => {
    vi.stubGlobal("fetch", vi.fn());

    (fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({data: "success"})
    })

    await expect(downloadSimplifierPackage("http://reg", "pkg", "/out", ""))
      .rejects.toThrow("Cannot find valid version in metadata")
  })

  it("throws when version doesn't exist", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      "dist-tags": {latest: "1.0.0"},
      versions: {"1.0.0": {version: "1.0.0", dist: {}}}
    }))))

    await expect(downloadSimplifierPackage("http://reg", "pkg", "/out", "a"))
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

    await downloadSimplifierPackage("http://reg", "pkg", tmpDir, "latest")

    expect(consoleSpy).toHaveBeenCalledWith('File "pkg-1.0.0.tgz" already exists locally. Skipping download.')
  })

  it("creates output directory if it does not exist during download", async () => {
    const tmp = makeTempDir()
    const outputDir = path.join(tmp, "non-existent-folder")

    vi.stubGlobal("fetch", vi.fn(async () => {
      return new Response(JSON.stringify({
        "dist-tags": {latest: "1.0.0"},
        versions: {"1.0.0": {version: "1.0.0", dist: {tarball: "http://test/pkg.tgz"}}}
      }), {status: 200})
    }))

    await expect(
      downloadSimplifierPackage("http://test", "my-package", outputDir, "latest")
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
    await expect(downloadSimplifierPackage("http://test", "my-package", tmp, "latest"))
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
    await expect(downloadSimplifierPackage("http://reg", "pkg", "/dir", "latest"))
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
    await expect(downloadSimplifierPackage("http://reg", "pkg", "/dir", "latest"))
      .rejects.toThrow("Version 2.0.0 not found in registry")
  })

  it("throws if tarball download request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async (url) => {
      if (url.endsWith("pkg")) return {
        ok: true,
        json: async () => ({
          "dist-tags": {latest: "1.0.0"},
          versions: {"1.0.0": {version: "1.0.0", dist: {tarball: "http://reg/tarball.tgz"}}}
        })
      }
      return {ok: false, statusText: "Forbidden"} // Fails on tarball fetch
    }))

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fhir-test-"))
    await expect(downloadSimplifierPackage("http://reg", "pkg", tmpDir, "latest"))
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
})
