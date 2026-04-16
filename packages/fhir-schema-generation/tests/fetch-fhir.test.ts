import * as fs from "node:fs"
import * as tar from "tar"
import {Readable} from "node:stream"
import {vi, type Mock, type MockInstance} from "vitest"

import {extractAndReadPackage, downloadSimplifierPackage} from "../src/utils/fetch-fhir.js"

vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  createWriteStream: vi.fn()
}))
vi.mock("tar", () => ({
  x: vi.fn()
}))
vi.mock("node:stream/promises", () => ({
  finished: vi.fn().mockResolvedValue(undefined)
}))
vi.mock("node:stream", () => ({
  Readable: {fromWeb: vi.fn().mockReturnValue({pipe: vi.fn()})}
}))

// Mock global fetch
global.fetch = vi.fn()

describe("FHIR Package Downloader", () => {
  const mockRegistry = "https://registry.example.com"
  const mockPackageName = "test-package"

  let logSpy: MockInstance
  let warningSpy: MockInstance

  beforeEach(() => {
    ; (fs.mkdirSync as unknown as Mock).mockImplementation(() => undefined)
    vi.spyOn(Readable, "fromWeb").mockReturnValue({
      pipe: vi.fn().mockReturnValue({})
    })
    vi.clearAllMocks()
    // Suppress console logs/warns during clean test runs
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    warningSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy.mockRestore()
    warningSpy.mockRestore()
    vi.restoreAllMocks()
  })

  describe("queryPackageVersion (via downloadSimplifierPackage)", () => {
    it("should resolve the latest version correctly", async () => {
      const mockMetadata = {
        "dist-tags": {latest: "1.0.1"},
        versions: {
          "1.0.1": {version: "1.0.1", dist: {tarball: "url-to-tarball"}}
        }
      };
      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetadata
      });

      // Mocking fs to trigger the "skip download" branch just to test version resolution quickly
      (fs.existsSync as unknown as Mock).mockReturnValue(true)

      await downloadSimplifierPackage(mockRegistry, mockPackageName, "latest")
      expect(global.fetch).toHaveBeenCalledWith(`${mockRegistry}/${mockPackageName}`)
    })

    it("should throw an error if the version does not exist", async () => {
      const mockMetadata = {
        "dist-tags": {latest: "1.0.1"},
        versions: {
          "1.0.5": {version: "1.0.5", dist: {tarball: "url-to-tarball"}}
        }
      };
      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetadata
      });

      // Mocking fs to trigger the "skip download" branch just to test version resolution quickly
      (fs.existsSync as unknown as Mock).mockReturnValue(true)

      await expect(downloadSimplifierPackage(mockRegistry, mockPackageName, "22.22.22"))
        .rejects.toThrow("Version 22.22.22 not found in registry.")
    })

    it("should throw an error if latest version does not exist", async () => {
      const mockMetadata = {
        "dist-tags": {latest: "1.0.1"},
        versions: {
          "1.0.5": {version: "1.0.5", dist: {tarball: "url-to-tarball"}}
        }
      };
      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetadata
      });

      // Mocking fs to trigger the "skip download" branch just to test version resolution quickly
      (fs.existsSync as unknown as Mock).mockReturnValue(true)

      await expect(downloadSimplifierPackage(mockRegistry, mockPackageName, "latest"))
        .rejects.toThrow("Version 1.0.1 not found in registry.")
    })

    it("should throw a warning if a later version is available", async () => {
      const mockMetadata = {
        "dist-tags": {latest: "1.0.15"},
        versions: {
          "1.0.5": {version: "1.0.5", dist: {tarball: "url-to-tarball"}},
          "1.0.15": {version: "1.0.15", dist: {tarball: "url-to-tarball"}}
        }
      };
      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetadata
      });

      // Mocking fs to trigger the "skip download" branch just to test version resolution quickly
      (fs.existsSync as unknown as Mock).mockReturnValue(true)

      await downloadSimplifierPackage(mockRegistry, mockPackageName, "1.0.5")
      expect(warningSpy).toHaveBeenCalled()
      expect(warningSpy).toHaveBeenCalledWith("A later version of this package is available", "1.0.15")
    })

    it("should throw an error if the fetch fails", async () => {
      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: false,
        statusText: "Not Found"
      })

      await expect(downloadSimplifierPackage(mockRegistry, mockPackageName, "latest"))
        .rejects.toThrow("Failed to fetch metadata: Not Found")
    })
  })

  describe("extractAndReadPackage", () => {
    const mockSource = "test-file.tgz"
    const mockTarget = "./extracted"

    it("should extract the tarball and read package.json", async () => {
      const mockPackageJson = {name: "test-package", version: "1.0.0"};

      (fs.existsSync as unknown as Mock)
        .mockReturnValueOnce(true) // Target dir exists
        .mockReturnValueOnce(true) // package.json exists

      ; (fs.readFileSync as unknown as Mock).mockReturnValueOnce(JSON.stringify(mockPackageJson))

      const result = await extractAndReadPackage(mockSource, mockTarget)

      expect(tar.x).toHaveBeenCalledWith(expect.objectContaining({file: mockSource, cwd: mockTarget}))
      expect(result).toEqual(mockPackageJson)
    })

    it("should create target directory if it does not exist", async () => {
      const mockPackageJson = {name: "test-package", version: "1.0.0"};
      (fs.existsSync as unknown as Mock)
        .mockReturnValueOnce(false) // Target dir missing
        .mockReturnValueOnce(true) // package.json not missing (to not throw)

      ; (fs.readFileSync as unknown as Mock).mockReturnValueOnce(JSON.stringify(mockPackageJson))

      await extractAndReadPackage(mockSource, mockTarget)
      expect(fs.mkdirSync).toHaveBeenCalledWith(mockTarget, {recursive: true})
    })

    it("should throw file does not exist", async () => {
      (fs.existsSync as unknown as Mock)
        .mockReturnValueOnce(false) // Target dir missing
        .mockReturnValueOnce(false) // package.json missing (to trigger the throw)

      await expect(extractAndReadPackage(mockSource, mockTarget)).rejects.toThrow()
    })

    it("should throw an error if package.json is missing after extraction", async () => {
      (fs.existsSync as unknown as Mock)
        .mockReturnValueOnce(true) // Target dir exists
        .mockReturnValueOnce(false) // package.json missing

      await expect(extractAndReadPackage(mockSource, mockTarget))
        .rejects.toThrow(/Could not find expected 'package\/package.json'/)
    })
  })

  describe("downloadSimplifierPackage (Orchestration)", () => {
    it("should successfully orchestrate download and extraction", async () => {
      // Mock metadata response
      const mockMetadata = {
        version: "2.0.0",
        "dist-tags": {latest: "2.0.0"},
        versions: {
          "2.0.0": {version: "2.0.0", dist: {tarball: "https://tarball.url"}}
        }
      };

      // fetch 1: metadata, fetch 2: tarball
      (global.fetch as unknown as Mock)
        .mockResolvedValueOnce({ok: true, json: async () => mockMetadata})
        .mockResolvedValueOnce({ok: true, body: "mock-stream"});

      // Ensure directories don't exist to trigger creation, and skip cache
      (fs.existsSync as unknown as Mock)
        .mockReturnValueOnce(false) // .output/raw missing
        .mockReturnValueOnce(false) // targetPath missing (skips cache)
        .mockReturnValueOnce(true) // parsed dir exists (extractAndReadPackage)
        .mockReturnValueOnce(true) // package.json exists

      ; (fs.createWriteStream as unknown as Mock).mockReturnValue("mock-write-stream")
      ; (fs.readFileSync as unknown as Mock).mockReturnValue('{"name": "test", "version": "2.0.0"}')

      const result = await downloadSimplifierPackage(mockRegistry, mockPackageName, "2.0.0")

      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining("raw"), {recursive: true})
      expect(global.fetch).toHaveBeenCalledTimes(2)
      expect(tar.x).toHaveBeenCalled()
      expect(result).toEqual({name: "test", version: "2.0.0"})
    })

    it("should skip download if the target tarball already exists locally", async () => {
      const mockMetadata = {
        version: "2.0.0",
        "dist-tags": {latest: "2.0.0"},
        versions: {
          "2.0.0": {version: "2.0.0", dist: {tarball: "https://tarball.url"}}
        }
      };

      (global.fetch as unknown as Mock).mockResolvedValueOnce({ok: true, json: async () => mockMetadata});

      (fs.existsSync as unknown as Mock)
        .mockReturnValueOnce(true) // .output/raw exists
        .mockReturnValueOnce(true) // targetPath exists! -> returns early

      await downloadSimplifierPackage(mockRegistry, mockPackageName, "2.0.0")

      // Fetch should only be called once (for metadata), tarball download is skipped
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(tar.x).not.toHaveBeenCalled()
    })

    it("should use the resolved version number in the cache path when 'latest' is requested", async () => {
      const mockMetadata = {
        version: "3.0.0",
        "dist-tags": {latest: "3.0.0"},
        versions: {
          "3.0.0": {version: "3.0.0", dist: {tarball: "https://tarball.url"}}
        }
      };

      (global.fetch as unknown as Mock)
        .mockResolvedValueOnce({ok: true, json: async () => mockMetadata})
        .mockResolvedValueOnce({ok: true, body: "mock-stream"});

      (fs.existsSync as unknown as Mock)
        .mockReturnValueOnce(false) // outputDir missing
        .mockReturnValueOnce(false) // targetPath missing
        .mockReturnValueOnce(true) // parsed dir exists
        .mockReturnValueOnce(true); // package.json exists

      (fs.createWriteStream as unknown as Mock).mockReturnValue("mock-write-stream");
      (fs.readFileSync as unknown as Mock).mockReturnValue('{"name": "test", "version": "3.0.0"}')

      await downloadSimplifierPackage(mockRegistry, mockPackageName, "latest")

      // Cache file must be named after the resolved version, not "latest"
      expect(fs.createWriteStream).toHaveBeenCalledWith(expect.stringContaining(`${mockPackageName}-3.0.0.tgz`))
      expect(fs.createWriteStream).not.toHaveBeenCalledWith(expect.stringContaining("latest"))
    })

    it("should use the resolved version number in the cache path when version is undefined", async () => {
      const mockMetadata = {
        version: "3.0.0",
        "dist-tags": {latest: "3.0.0"},
        versions: {
          "3.0.0": {version: "3.0.0", dist: {tarball: "https://tarball.url"}}
        }
      };

      (global.fetch as unknown as Mock)
        .mockResolvedValueOnce({ok: true, json: async () => mockMetadata})
        .mockResolvedValueOnce({ok: true, body: "mock-stream"});

      (fs.existsSync as unknown as Mock)
        .mockReturnValueOnce(false) // outputDir missing
        .mockReturnValueOnce(false) // targetPath missing
        .mockReturnValueOnce(true) // parsed dir exists
        .mockReturnValueOnce(true); // package.json exists

      (fs.createWriteStream as unknown as Mock).mockReturnValue("mock-write-stream");
      (fs.readFileSync as unknown as Mock).mockReturnValue('{"name": "test", "version": "3.0.0"}')

      await downloadSimplifierPackage(mockRegistry, mockPackageName)

      // Cache file must be named after the resolved version, not "undefined"
      expect(fs.createWriteStream).toHaveBeenCalledWith(expect.stringContaining(`${mockPackageName}-3.0.0.tgz`))
      expect(fs.createWriteStream).not.toHaveBeenCalledWith(expect.stringContaining("undefined"))
    })
  })
})
