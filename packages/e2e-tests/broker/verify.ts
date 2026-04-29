import {
  ApiMode,
  ApiEndpoint,
  ApiOperation,
  createConsumerName,
  createProviderName,
  getPacticipantSuffix,
  getProviderBaseUrl
} from "../resources/common"
import path from "path"
import {Verifier, VerifierOptions} from "@pact-foundation/pact"
import {getAuthToken} from "./oauth"

// define variable that is retrieved at runtime for an oauth2 token
let oAuth2Token: string

type RequestFilterRequest = {
  headers: Record<string, string | Array<string> | undefined>
}

type RequestFilterNext = () => void

function getRequiredEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function getApiMode(): ApiMode {
  const apiMode = getRequiredEnvVar("API_MODE")
  if (apiMode === "live" || apiMode === "sandbox") {
    return apiMode
  }

  throw new Error(`Unsupported API_MODE: ${apiMode}`)
}

async function verify(endpoint: ApiEndpoint, operation?: ApiOperation): Promise<string> {
  const pactVersion = getRequiredEnvVar("PACT_VERSION")
  const apiMode = getApiMode()
  const apiDeploymentMethod = getRequiredEnvVar("API_DEPLOYMENT_METHOD")
  const providerBaseUrl = getProviderBaseUrl(apiDeploymentMethod, endpoint, operation)
  const providerVersionTag = process.env.PACT_TAG
  const providerVersion = providerVersionTag
    ? `${pactVersion} (${providerVersionTag})`
    : pactVersion
  const pacticipantSuffix = getPacticipantSuffix(apiMode)
  const providerName = createProviderName(
    pacticipantSuffix,
    endpoint,
    pactVersion,
    operation
  )
  const consumerName = createConsumerName(
    pacticipantSuffix,
    pactVersion
  )
  const fileName = path.join(__dirname, "../pact/pacts", `${consumerName}-${providerName}.json`)
  const apigeeEnvironment = getRequiredEnvVar("APIGEE_ENVIRONMENT")

  const verifierOptions: VerifierOptions = {
    consumerVersionTags: [pactVersion],
    provider: providerName,
    providerVersion: providerVersion,
    providerBaseUrl: providerBaseUrl,
    logLevel: "error",
    pactUrls: [fileName],
    customProviderHeaders: {
      "NHSD-Session-URID": "555254242106" // for user UID 656005750108
    },
    // use a request filter to inject a valid auth token at runtime
    requestFilter: (req: RequestFilterRequest, _res: unknown, next: RequestFilterNext) => {
      if (!req.headers["authorization"]) {
        next()
        return
      }
      if (!apigeeEnvironment.includes("sandbox")) {
        req.headers["authorization"] = `Bearer ${oAuth2Token}`
      }
      next()
    }
  }

  const verifier = new Verifier(verifierOptions)
  return await verifier.verifyProvider()
}

async function verifyOnce(endpoint: ApiEndpoint, operation?: ApiOperation) {
  // debug endpoints not available in prod
  if (getRequiredEnvVar("APIGEE_ENVIRONMENT") !== "prod" || (endpoint !== "validate")) {
    await verify(endpoint, operation)
      .catch((error) => {
        console.error(error)
        process.exit(1)
      })
  }
}

async function verifyValidate(): Promise<void> {
  await verifyOnce("validate")
}

async function verifyPrepare(): Promise<void> {
  await verifyOnce("prepare")
}

async function verifySend(): Promise<void> {
  await verifyOnce("process", "send")
}

async function verifyCancel(): Promise<void> {
  await verifyOnce("process", "cancel")
}

async function verifyRelease(): Promise<void> {
  await verifyOnce("task", "release")
}

async function verifyDispense(): Promise<void> {
  await verifyOnce("process", "dispense")
}

async function verifyDispenseAmend(): Promise<void> {
  await verifyOnce("process", "dispenseamend")
}

async function verifyReturn(): Promise<void> {
  await verifyOnce("task", "return")
}

async function verifyWithdraw(): Promise<void> {
  await verifyOnce("task", "withdraw")
}

async function verifyClaim(): Promise<void> {
  await verifyOnce("claim")
}

// todo: why is this disabled?
// async function verifyClaimAmend(): Promise<void> {
//   await verifyOnce("claim", "amend")
// }

async function verifyMetadata(): Promise<void> {
  await verifyOnce("metadata")
}

async function verifyTaskTracker(): Promise<void> {
  await verifyOnce("task", "tracker")
}

async function getAccessToken(): Promise<void> {
  if (!getRequiredEnvVar("APIGEE_ENVIRONMENT").includes("sandbox")) {
    oAuth2Token = await getAuthToken()
  }
}

(async () => {
  await getAccessToken()
    .then(verifyMetadata)
    .then(verifyValidate)
    .then(verifyPrepare)
    .then(verifySend)
    .then(verifyCancel)
    .then(verifyRelease)
    .then(verifyReturn)
    .then(verifyDispense)
    .then(verifyDispenseAmend)
    .then(verifyWithdraw)
    .then(verifyClaim)
    // .then(verifyClaimAmend)
    .then(verifyTaskTracker)
})()
