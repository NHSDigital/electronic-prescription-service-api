import * as fs from "node:fs"
import * as tar from "tar"
import {
  vi,
  describe,
  it,
  expect,
  beforeEach,
  afterEach
} from "vitest"
import type {Mock, MockInstance} from "vitest"

import {extractAndReadPackage, downloadSimplifierPackage} from "../src/utils/download-simplifier-package.js"
import {buildMockMetadata, buildVersionEntry} from "./helpers/package-metadata.js"

vi.mock("node:fs")
vi.mock("tar")
vi.mock("node:stream/promises", () => ({
  finished: vi.fn().mockResolvedValue(undefined)
}))
vi.mock("node:stream", () => ({
  Readable: {fromWeb: vi.fn().mockReturnValue({pipe: vi.fn()})}
}))

global.fetch = vi.fn()

describe("fetch-fhir", () => {
  let logSpy: MockInstance
  let warnSpy: MockInstance

  beforeEach(() => {
    vi.clearAllMocks()
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy.mockRestore()
    warnSpy.mockRestore()
  })

  describe("queryPackageVersion (via downloadSimplifierPackage)", () => {
    it("should resolve the latest version correctly when version is 'latest'", async () => {
      const mockMetadata = buildMockMetadata("1.0.0", {"1.0.0": buildVersionEntry("1.0.0")});
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetadata
      });

      (fs.existsSync as Mock).mockReturnValue(true)

      await downloadSimplifierPackage("https://registry.example.com", "test-pkg", ".", "latest")
      expect(global.fetch).toHaveBeenCalledWith("https://registry.example.com/test-pkg")
    })

    it("should throw an error if version is undefined", async () => {
      const mockMetadata = buildMockMetadata("2.0.0", {"2.0.0": buildVersionEntry("2.0.0")});
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetadata
      });

      (fs.existsSync as Mock).mockReturnValue(true)

      await expect(downloadSimplifierPackage("https://registry.example.com", "test-pkg", "."))
        .rejects.toThrow("Version not provided")
    })

    it("should throw an error if the version does not exist", async () => {
      const mockMetadata = buildMockMetadata("1.0.0", {"1.0.0": buildVersionEntry("1.0.0", "url")});
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetadata
      })

      await expect(downloadSimplifierPackage("https://reg.example.com", "pkg", ".", "9.9.9"))
        .rejects.toThrow("Version 9.9.9 not found in registry.")
    })

    it("should warn when a later version is available", async () => {
      const mockMetadata = buildMockMetadata("2.0.0", {
        "1.0.0": buildVersionEntry("1.0.0"),
        "2.0.0": buildVersionEntry("2.0.0")
      });
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetadata
      });

      (fs.existsSync as Mock).mockReturnValue(true)

      await downloadSimplifierPackage("https://reg.example.com", "pkg", ".", "1.0.0")
      expect(warnSpy).toHaveBeenCalledWith("A later version of this package is available", "2.0.0")
    })

    it("should NOT warn about later version when version is 'latest'", async () => {
      const mockMetadata = buildMockMetadata("2.0.0", {
        "1.0.0": buildVersionEntry("1.0.0", "url"),
        "2.0.0": buildVersionEntry("2.0.0", "url")
      });
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetadata
      });

      (fs.existsSync as Mock).mockReturnValue(true)

      await downloadSimplifierPackage("https://reg.example.com", "pkg", ".", "latest")
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it("should throw an error if the fetch fails", async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        statusText: "Not Found"
      })

      await expect(downloadSimplifierPackage("https://reg.example.com", "pkg", ".", "latest"))
        .rejects.toThrow("Failed to fetch metadata: Not Found")
    })

    it("should throw when latest resolves to null", async () => {
      const mockMetadata = {
        "dist-tags": {},
        versions: {}
      };
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetadata
      })

      await expect(downloadSimplifierPackage("https://reg.example.com", "pkg", ".", "latest"))
        .rejects.toThrow("Cannot find valid version in metadata")
    })
  })

  describe("extractAndReadPackage", () => {
    it("should extract and read package.json", async () => {
      const mockPackageJson = {name: "test", version: "1.0.0"};

      (fs.existsSync as Mock)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true);

      (fs.readFileSync as Mock).mockReturnValueOnce(JSON.stringify(mockPackageJson))

      const result = await extractAndReadPackage("file.tgz", "./target")

      expect(tar.x).toHaveBeenCalled()
      expect(result).toEqual(mockPackageJson)
    })

    it("should create target directory if missing", async () => {
      const mockPackageJson = {name: "test", version: "1.0.0"};
      (fs.existsSync as Mock)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      (fs.readFileSync as Mock).mockReturnValueOnce(JSON.stringify(mockPackageJson))

      await extractAndReadPackage("file.tgz", "./newdir")
      expect(fs.mkdirSync).toHaveBeenCalledWith("./newdir", {recursive: true})
    })

    it("should throw if package.json is missing after extraction", async () => {
      (fs.existsSync as Mock)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false)

      await expect(extractAndReadPackage("file.tgz", "./target"))
        .rejects.toThrow(/Could not find expected 'package\/package.json'/)
    })
  })

  describe("downloadSimplifierPackage orchestration", () => {
    it("should download and extract when file does not exist", async () => {
      const mockMetadata = buildMockMetadata("3.0.0", {"3.0.0": buildVersionEntry("3.0.0")});

      (global.fetch as Mock)
        .mockResolvedValueOnce({ok: true, json: async () => mockMetadata})
        .mockResolvedValueOnce({ok: true, body: "mock-stream"});

      (fs.existsSync as Mock)
        .mockReturnValueOnce(false) // outputDir missing
        .mockReturnValueOnce(true) // target dir exists (extractAndReadPackage)
        .mockReturnValueOnce(true); // package.json exists

      (fs.createWriteStream as Mock).mockReturnValue("mock-stream");
      (fs.readFileSync as Mock).mockReturnValue('{"name": "test", "version": "3.0.0"}')

      await downloadSimplifierPackage("https://reg.example.com", "pkg", ".", "3.0.0")

      expect(fs.mkdirSync).toHaveBeenCalled()
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it("should skip download if file already exists", async () => {
      const mockMetadata = buildMockMetadata("3.0.0", {"3.0.0": buildVersionEntry("3.0.0")});

      (global.fetch as Mock).mockResolvedValueOnce({ok: true, json: async () => mockMetadata});

      (fs.existsSync as Mock)
        .mockReturnValueOnce(true) // outputDir exists
        .mockReturnValueOnce(true) // outputFile exists

      await downloadSimplifierPackage("https://reg.example.com", "pkg", ".", "3.0.0")

      expect(global.fetch).toHaveBeenCalledTimes(1) // only metadata fetch
      expect(tar.x).not.toHaveBeenCalled()
    })

    it("should throw when tarball URL is missing", async () => {
      const mockMetadata = buildMockMetadata("3.0.0", {"3.0.0": {version: "3.0.0", dist: {}, url: ""}});

      (global.fetch as Mock).mockResolvedValueOnce({ok: true, json: async () => mockMetadata});

      (fs.existsSync as Mock)
        .mockReturnValueOnce(true) // outputDir exists
        .mockReturnValueOnce(false) // no local file

      await expect(downloadSimplifierPackage("https://reg.example.com", "pkg", ".", "3.0.0"))
        .rejects.toThrow("Failed to find valid URL for Tarball")
    })

    it("should throw when tarball download fails", async () => {
      const mockMetadata = buildMockMetadata("3.0.0", {"3.0.0": buildVersionEntry("3.0.0")});

      (global.fetch as Mock)
        .mockResolvedValueOnce({ok: true, json: async () => mockMetadata})
        .mockResolvedValueOnce({ok: false, statusText: "Server Error", body: null});

      (fs.existsSync as Mock)
        .mockReturnValueOnce(true) // outputDir exists
        .mockReturnValueOnce(false) // no local file

      await expect(downloadSimplifierPackage("https://reg.example.com", "pkg", ".", "3.0.0"))
        .rejects.toThrow("Failed to download tarball: Server Error")
    })

    it("should use url property when dist.tarball is missing", async () => {
      const mockMetadata = buildMockMetadata("3.0.0", {
        "3.0.0": {version: "3.0.0", dist: {}, url: "https://fallback.url/tarball.tgz"}
      });

      (global.fetch as Mock)
        .mockResolvedValueOnce({ok: true, json: async () => mockMetadata})
        .mockResolvedValueOnce({ok: true, body: "mock-stream"});

      (fs.existsSync as Mock)
        .mockReturnValueOnce(false) // outputDir missing
        .mockReturnValueOnce(true) // target dir exists
        .mockReturnValueOnce(true); // package.json exists

      (fs.createWriteStream as Mock).mockReturnValue("mock-stream");
      (fs.readFileSync as Mock).mockReturnValue('{"name": "test", "version": "3.0.0"}')

      await downloadSimplifierPackage("https://reg.example.com", "pkg", ".", "3.0.0")

      expect(global.fetch).toHaveBeenCalledTimes(2)
      expect((global.fetch as Mock).mock.calls[1][0]).toBe("https://fallback.url/tarball.tgz")
    })
  })
})
