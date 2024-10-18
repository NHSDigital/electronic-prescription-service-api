import {MtlsSpineClient} from "../../../src/services/communication/mtls-spine-client"
import {LiveSpineClient} from "../../../src/services/communication/live-spine-client"
import {SandboxSpineClient} from "../../../src/services/communication/sandbox-spine-client"
import {getSpineClient, SpineClient} from "../../../src/services/communication/spine-client"

describe("Spine Client Factory", () => {
  test("Returns MtlsSpineClient when useMtlsSpineClient is true", () => {
    const spineClient: SpineClient = getSpineClient(true, true)
    expect(spineClient).toBeInstanceOf(MtlsSpineClient)
  })

  test("Returns LiveSpineClient when useMtlsSpineClient is false and liveMode is true", () => {
    const spineClient: SpineClient = getSpineClient(false, true)
    expect(spineClient).toBeInstanceOf(LiveSpineClient)
  })

  test("Returns SandboxSpineClient when useMtlsSpineClient is false and liveMode is false", () => {
    const spineClient: SpineClient = getSpineClient(false, false)
    expect(spineClient).toBeInstanceOf(SandboxSpineClient)
  })

  test("Handles environmental variable setup correctly", () => {
    const originalMtlsSpineClient = process.env.MTLS_SPINE_CLIENT
    const originalSandbox = process.env.SANDBOX

    process.env.MTLS_SPINE_CLIENT = "1"
    process.env.SANDBOX = "0"

    const useMtlsSpineClient = process.env.MTLS_SPINE_CLIENT === "1"
    const liveMode = process.env.SANDBOX !== "1"
    const spineClient = getSpineClient(useMtlsSpineClient, liveMode)

    expect(spineClient).toBeInstanceOf(MtlsSpineClient)

    process.env.MTLS_SPINE_CLIENT = originalMtlsSpineClient
    process.env.SANDBOX = originalSandbox
  })
})
