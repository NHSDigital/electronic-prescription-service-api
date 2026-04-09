import {
  describe,
  expect,
  it,
  vi,
  beforeEach,
  afterEach
} from "vitest"

// 1. Setup Hoisted Variables for our Mocks so they persist across module resets
const mockDownload = vi.fn()
const mockProcessSpecs = vi.fn()
const mockGetSpecs = vi.fn()

// 2. Mock the modules
vi.mock("../src/utils/download-simplifier-package.js", () => ({
  downloadSimplifierPackage: (...args: Array<any>) => mockDownload(...args)
}))

vi.mock("../src/utils/process-simplifier-package-specification.js", () => {
  // Use an actual class to ensure 'new SchemaProcessor()' works seamlessly
  return {
    SchemaProcessor: class {
      processSimplifierPackageSpecifications(...args: Array<any>) {
        return mockProcessSpecs(...args)
      }
      getSpecifications(...args: Array<any>) {
        return mockGetSpecs(...args)
      }
    }
  }
})

describe("index.ts - Schema Generation Pipeline", () => {
  let exitSpy: ReturnType<typeof vi.spyOn>
  let consoleLogSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Reset Vitest module registry so index.ts evaluates fully on every dynamic import
    vi.resetModules()

    // Reset mock call histories
    mockDownload.mockReset()
    mockProcessSpecs.mockReset()
    mockGetSpecs.mockReset()

    // Configure default successful mock behaviors
    mockDownload.mockResolvedValue(undefined)
    mockGetSpecs.mockReturnValue(new Map([["MedicationRequest", {type: "object", title: "MedicationRequest Mock"}]]))

    // Intercept process.exit
    exitSpy = vi.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit called with code ${code}`)
    })

    // Silence console logs to keep test output clean
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {})

    // Intercept console.error.
    // IMPORTANT: If index.ts hits the catch block unexpectedly, this will throw the underlying error
    // so you can see exactly WHAT caused the pipeline to fail in the test logs.
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation((msg, err) => {
      throw err || new Error(msg)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should run the schema generation pipeline successfully", async () => {
    // Execute the index.ts pipeline
    await import("../src/index.js")

    // 1. Assert standard logs
    expect(consoleLogSpy).toHaveBeenCalledWith("Starting schema generation pipeline...")

    // 2. Assert downloadSimplifierPackage was called
    expect(mockDownload).toHaveBeenCalledTimes(1)
    expect(mockDownload).toHaveBeenCalledWith(
      "https://packages.simplifier.net",
      "hl7.fhir.r4.core",
      expect.stringContaining("hl7.fhir.r4.core-latest"),
      "latest"
    )

    // 3. Assert processor methods were triggered properly
    expect(mockProcessSpecs).toHaveBeenCalledTimes(1)
    expect(mockProcessSpecs).toHaveBeenCalledWith(
      expect.stringContaining("StructureDefinition-MedicationRequest.json"),
      "StructureDefinition-"
    )
    expect(mockGetSpecs).toHaveBeenCalledTimes(1)

    // 4. Assert end result logging
    expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify({type: "object", title: "MedicationRequest Mock"}))

    // 5. Assert process.exit was NOT called on a successful run
    expect(exitSpy).not.toHaveBeenCalled()
  })

  it("should catch errors, log them, and exit with code 1 if the pipeline fails", async () => {
    // Overwrite the consoleErrorSpy for this test so it DOES NOT throw,
    // because we actually expect an error to be logged during a failure path.
    consoleErrorSpy.mockImplementation(() => {})

    const mockError = new Error("Mocked download failure")
    mockDownload.mockRejectedValueOnce(mockError)

    // Import the file and expect the mock implementation of process.exit to throw
    await expect(import("../src/index.js")).rejects.toThrow("process.exit called with code 1")

    // 1. Assert the error log printed the failure message
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "\n\n=== Schema generation pipeline failed ===\n\n",
      mockError
    )

    // 2. Assert process exited with failure code
    expect(exitSpy).toHaveBeenCalledTimes(1)
    expect(exitSpy).toHaveBeenCalledWith(1)
  })
})
