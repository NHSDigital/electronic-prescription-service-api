import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import * as tar from "tar"
import {Readable} from "node:stream"
import {
  afterEach,
  describe,
  expect,
  it,
  vi
} from "vitest"

import {downloadSimplifierPackage, extractAndReadPackage} from "../src/utils/download-simplifier-package.js"

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "fhir-schema-test-"))
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("download-simplifier-package utilities", () => {
  describe("downloadSimplifierPackage", () => {
    it("downloads metadata and tarball then extracts package", async () => {
      const tmp = makeTempDir()

      const sourcePackageDir = path.join(tmp, "source-package")
      fs.mkdirSync(path.join(sourcePackageDir, "package"), {recursive: true})
      const packageJson = {name: "my-package", version: "1.0.0"}
      fs.writeFileSync(path.join(sourcePackageDir, "package", "package.json"), JSON.stringify(packageJson), "utf-8")

      const tarballPath = path.join(tmp, "my-package.tgz")
      await tar.create({gzip: true, file: tarballPath, cwd: sourcePackageDir}, ["package"])

      vi.stubGlobal("fetch", vi.fn(async (resource: string) => {
        if (resource === "http://test-registry/my-package") {
          const body = JSON.stringify({
            "dist-tags": {latest: "1.0.0"},
            versions: {
              "1.0.0": {
                version: "1.0.0",
                dist: {tarball: "http://test-registry/my-package.tgz"}
              }
            }
          })
          return new Response(body, {status: 200})
        }

        if (resource === "http://test-registry/my-package.tgz") {
          const stream = fs.createReadStream(tarballPath)
          return new Response(Readable.toWeb(stream) as any, {status: 200})
        }

        return new Response("Not found", {status: 404})
      }))

      const outputDir = path.join(tmp, "output")

      await downloadSimplifierPackage("http://test-registry", "my-package", outputDir, "latest")

      const extractedPackageJson = JSON.parse(fs.readFileSync(path.join(outputDir, "package", "package.json"), "utf-8"))
      expect(extractedPackageJson).toEqual(packageJson)
    }, 20000)

    it("skips download if the target tarball already exists locally", async () => {
      const tmp = makeTempDir()
      const outputDir = path.join(tmp, "output")
      fs.mkdirSync(outputDir, {recursive: true})

      // Simulate existing tarball
      fs.writeFileSync(path.join(outputDir, "my-package-1.0.0.tgz"), "dummy content")

      const consoleSpy = vi.spyOn(console, "log")

      vi.stubGlobal("fetch", vi.fn(async () => {
        return new Response(JSON.stringify({
          "dist-tags": {latest: "1.0.0"},
          versions: {"1.0.0": {version: "1.0.0", dist: {}}}
        }), {status: 200})
      }))

      await downloadSimplifierPackage("http://test-registry", "my-package", outputDir, "latest")

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("already exists locally. Skipping download."))
    })

    it("throws when metadata fetch fails", async () => {
      vi.stubGlobal("fetch", vi.fn(async () => {
        return new Response("Internal Server Error", {status: 500, statusText: "Internal Server Error"})
      }))

      await expect(downloadSimplifierPackage("http://test-registry", "my-package", "/tmp", "latest"))
        .rejects.toThrow("Failed to fetch metadata: Internal Server Error")
    })

    it("throws when metadata has no tarball URL", async () => {
      vi.stubGlobal("fetch", vi.fn(async () => {
        return new Response(JSON.stringify({
          "dist-tags": {latest: "1.0.0"},
          versions: {"1.0.0": {version: "1.0.0", dist: {}}}
        }), {status: 200})
      }))

      await expect(downloadSimplifierPackage("http://test-registry", "my-package", "/tmp", "latest")).rejects.toThrow()
    })
  })

  it("throws when version is not provided", async () => {
    await expect(downloadSimplifierPackage("http://test-registry", "my-package", "/tmp", ""))
      .rejects.toThrow("Version not provided")
  })

  it("throws when target version cannot be resolved from metadata", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      return new Response(JSON.stringify({
        "dist-tags": {}, // Missing 'latest'
        versions: {}
      }), {status: 200})
    }))

    await expect(downloadSimplifierPackage("http://test-registry", "my-package", "/tmp", "latest"))
      .rejects.toThrow("Cannot find valid version in metadata")
  })

  it("throws when specified version is not found in registry", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      return new Response(JSON.stringify({
        "dist-tags": {latest: "2.0.0"},
        versions: {"2.0.0": {version: "2.0.0"}}
      }), {status: 200})
    }))

    await expect(downloadSimplifierPackage("http://test-registry", "my-package", "/tmp", "1.0.0"))
      .rejects.toThrow("Version 1.0.0 not found in registry.")
  })

  it("warns when downloading a version older than latest", async () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.endsWith("my-package")) {
        return new Response(JSON.stringify({
          "dist-tags": {latest: "2.0.0"},
          versions: {"1.0.0": {version: "1.0.0", dist: {tarball: "http://test-registry/my-package.tgz"}}}
        }), {status: 200})
      }
      return new Response("Not found", {status: 404})
    }))

    // The tarball fetch will 404 based on the stub, but we just want to verify the warning was emitted first
    await expect(downloadSimplifierPackage("http://test-registry", "my-package", "/tmp", "1.0.0"))
      .rejects.toThrow()

    expect(consoleWarnSpy).toHaveBeenCalledWith("A later version of this package is available", "2.0.0")
  })

  it("throws when tarball download request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.endsWith("my-package")) {
        return new Response(JSON.stringify({
          "dist-tags": {latest: "1.0.0"},
          versions: {"1.0.0": {version: "1.0.0", dist: {tarball: "http://test-registry/my-package.tgz"}}}
        }), {status: 200})
      }
      if (url.endsWith(".tgz")) {
        return new Response("Not Found", {status: 404, statusText: "Not Found"})
      }
      return new Response("Error", {status: 500})
    }))

    await expect(downloadSimplifierPackage("http://test-registry", "my-package", "/tmp", "latest"))
      .rejects.toThrow("Failed to download tarball: Not Found")
  })

  describe("extractAndReadPackage", () => {
    it("throws an error if extracted archive is missing package/package.json", async () => {
      const tmp = makeTempDir()

      const sourcePackageDir = path.join(tmp, "source-package")
      fs.mkdirSync(path.join(sourcePackageDir, "package"), {recursive: true})
      // Notice we are NOT creating package.json here

      const tarballPath = path.join(tmp, "my-package.tgz")
      await tar.create({gzip: true, file: tarballPath, cwd: sourcePackageDir}, ["package"])

      const outputDir = path.join(tmp, "output")

      await expect(extractAndReadPackage(tarballPath, outputDir)).rejects.toThrow(
        "Could not find expected 'package/package.json' inside"
      )
    })
  })

})
