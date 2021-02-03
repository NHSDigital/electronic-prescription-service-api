import { VerifierV3 } from "@pact-foundation/pact"
import { PactGroups } from "../resources/common"

let endpoint: string
let pactGroup: string

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
      provider: `${process.env.PACT_PROVIDER}+${endpoint}${pactGroup ? "-" + pactGroup : ""}+${process.env.PACT_VERSION}`,
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

function resetBackOffRetryTimer() {
  sleepMs = 0
}

async function verifyWith2Retries() {
  await verify()
    .catch(verify)
    .catch(verify)
    .catch(() => process.exit(1))
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function verifyConvert(): Promise<any> {
  const pactGroups = PactGroups.filter(g => g !== "accept-header")

  await pactGroups.reduce(async (promise, group) => {
    await promise
    endpoint = "convert"
    pactGroup = group
    resetBackOffRetryTimer()
    await verifyWith2Retries()
  }, Promise.resolve())
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function verifyPrepare(): Promise<any> {
  endpoint = "prepare"
  pactGroup = ""
  resetBackOffRetryTimer()
  await verifyWith2Retries()
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function verifyProcess(): Promise<any> {
    const pactGroups =
      process.env.PACT_PROVIDER_URL.includes("sandbox")
      ? PactGroups.filter(g => g !== "failures")
      : PactGroups

    await pactGroups.reduce(async (promise, group) => {
      await promise
      endpoint = "process"
      pactGroup = group
      resetBackOffRetryTimer()
      await verifyWith2Retries()
    }, Promise.resolve())
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function verifyRelease(): Promise<any> {
  //if (process.env.PACT_PROVIDER_URL.includes("sandbox")) {
    endpoint = "release"
    pactGroup = ""
    resetBackOffRetryTimer()
    await verifyWith2Retries()
  //} 
}

(async () => {
  verifyConvert()
    .then(verifyPrepare)
    .then(verifyProcess)
    .then(verifyRelease)
})()

