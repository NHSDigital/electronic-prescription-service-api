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
const mockParseSimplifierPackage = vi.fn()
const mockGenerateSchema = vi.fn()

// 2. Mock the modules
vi.mock("../src/utils/download-simplifier-package.js", () => ({
  downloadSimplifierPackage: (...args: Array<any>) => mockDownload(...args)
}))

vi.mock("../src/utils/parse-simplifier-package.js", () => ({
  parseSimplifierPackage: (...args: Array<any>) => mockParseSimplifierPackage(...args)
}))

vi.mock("../src/utils/generate-schema.js", () => ({
  generateSchema: (...args: Array<any>) => mockGenerateSchema(...args)
}))

describe("index.ts - Schema Generation Pipeline", () => {
  let exitSpy: ReturnType<typeof vi.spyOn>
  let consoleLogSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Reset Vitest module registry so index.ts evaluates fully on every dynamic import
    vi.resetModules()

    // Reset mock call histories
    mockDownload.mockReset()
    mockParseSimplifierPackage.mockReset()
    mockGenerateSchema.mockReset()

    // Configure default successful mock behaviors
    mockDownload.mockResolvedValue(undefined)
    mockParseSimplifierPackage.mockReturnValue({id: "MedicationRequest", kind: "resource"})
    mockGenerateSchema.mockReturnValue({MedicationRequest: {type: "object", title: "MedicationRequest Mock"}})

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
    expect(consoleLogSpy).toHaveBeenCalledWith("downloading simplifier package...")

    // 2. Assert downloadSimplifierPackage was called
    expect(mockDownload).toHaveBeenCalledTimes(1)
    expect(mockDownload).toHaveBeenCalledWith(
      "https://packages.simplifier.net",
      "hl7.fhir.r4.core",
      expect.stringContaining("hl7.fhir.r4.core-latest"),
      "latest"
    )

    // 3. Assert parseSimplifierPackage and generateSchema were triggered properly
    expect(mockParseSimplifierPackage).toHaveBeenCalledTimes(1)
    expect(mockParseSimplifierPackage).toHaveBeenCalledWith(
      expect.stringContaining("StructureDefinition-MedicationRequest.json")
    )
    expect(mockGenerateSchema).toHaveBeenCalledTimes(1)

    // 4. Assert end result logging
    expect(consoleLogSpy).toHaveBeenCalledWith("done")

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
      "schema generation failed",
      mockError
    )

    // 2. Assert process exited with failure code
    expect(exitSpy).toHaveBeenCalledTimes(1)
    expect(exitSpy).toHaveBeenCalledWith(1)
  })
})
