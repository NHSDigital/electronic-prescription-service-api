import { VerifierV3 } from "@pact-foundation/pact"

let endpoint: string

let token: string

let sleepMs = 0

function sleep(milliseconds: number) {
  const date = Date.now()
  let currentDate = null
  do {
    currentDate = Date.now()
  } while (currentDate - date < milliseconds)
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function verify(): Promise<any> {
    sleep(sleepMs)
    sleepMs = (sleepMs + 5000) * 2
    const isLocal = process.env.PACT_PROVIDER_URL === "http://localhost:9000"
    const providerVersion = process.env.PACT_TAG
      ? `${process.env.PACT_VERSION} (${process.env.PACT_TAG})`
      : process.env.PACT_VERSION
    const verifier =  new VerifierV3({
      publishVerificationResult: !isLocal,
      pactBrokerUrl: isLocal ? undefined : process.env.PACT_BROKER_URL,
      pactBrokerUsername: process.env.PACT_BROKER_BASIC_AUTH_USERNAME,
      pactBrokerPassword: process.env.PACT_BROKER_BASIC_AUTH_PASSWORD,
      consumerVersionTag: process.env.PACT_VERSION,
      provider: `${process.env.PACT_PROVIDER}+${endpoint}+${process.env.PACT_VERSION}`,
      providerVersion: providerVersion,
      providerBaseUrl: process.env.PACT_PROVIDER_URL,
      logLevel: "info",
      stateHandlers: {
        "is authenticated": () => {
          token = `${process.env.APIGEE_ACCESS_TOKEN}`
          Promise.resolve(`Valid bearer token generated`)
        },
        "is not authenticated": () => {
          token = ""
          Promise.resolve(`Invalid bearer token generated`)
        }
      },
      requestFilter: (req) => {
        req.headers["x-smoke-test"] = "1"
        req.headers["Authorization"] = `Bearer ${token}`
        return req
      },
      pactUrls: isLocal
        ? [
          `${process.cwd()}/pact/pacts/${process.env.PACT_CONSUMER}+${endpoint}+${process.env.PACT_VERSION}-${process.env.PACT_PROVIDER}+${process.env.PACT_VERSION}.json`
        ]
        : []
    })
    return await verifier.verifyProvider()
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function verifyConvert(): Promise<any> {
  endpoint = "convert-failures"
  sleepMs = 0
  await verify().catch(verify).catch(verify)
  endpoint = "convert-secondarycare-community-acute"
  sleepMs = 0
  await verify().catch(verify).catch(verify)
  endpoint = "convert-secondarycare-community-repeatdispensing"
  sleepMs = 0
  await verify().catch(verify).catch(verify)
  endpoint = "convert-secondarycare-homecare"
  sleepMs = 0
  await verify().catch(verify).catch(verify)
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function verifyPrepare(): Promise<any> {
  endpoint = "prepare"
  sleepMs = 0
  await verify().catch(verify).catch(verify)
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function verifyProcess(): Promise<any> {
    endpoint = "process-accept-header"
    sleepMs = 0
    await verify().catch(verify).catch(verify)
  if (!process.env.PACT_PROVIDER_URL.includes("sandbox")) {
    endpoint = "process-failures"
    sleepMs = 0
    await verify().catch(verify).catch(verify)
  }
  endpoint = "process-secondarycare-community-acute"
  sleepMs = 0
  await verify().catch(verify).catch(verify)
  endpoint = "process-secondarycare-community-repeatdispensing"
  sleepMs = 0
  await verify().catch(verify).catch(verify)
  endpoint = "process-secondarycare-homecare"
  sleepMs = 0
  await verify().catch(verify).catch(verify)
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function verifyRelease(): Promise<any> {
  endpoint = "release"
  sleepMs = 0
  await verify().catch(verify).catch(verify)
}

(async () => {
  verifyConvert()
    .catch()
    .finally(verifyPrepare)
    .catch()
    .finally(verifyProcess)
    .catch()
    .finally(verifyRelease)
})()

