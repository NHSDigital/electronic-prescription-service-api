/* eslint-disable-next-line  @typescript-eslint/no-unused-vars */
import register from "tsconfig-paths/register"
import {
  ApiEndpoint,
  ApiOperation,
  createConsumerName,
  createProviderName,
  getPacticipantSuffix,
  getProviderBaseUrl
} from "../resources/common"
import path from "path"
import {Verifier, VerifierOptions} from "@pact-foundation/pact"
import {getAuthToken} from "broker/oauth"

// define variable that is retrieved at runtime for an oauth2 token
let oAuth2Token: string

async function verify(endpoint: string, operation?: string): Promise<string> {
  const providerVersion = process.env.PACT_TAG
    ? `${process.env.PACT_VERSION} (${process.env.PACT_TAG})`
    : process.env.PACT_VERSION
  const pacticipantSuffix = getPacticipantSuffix(process.env["API_MODE"])
  const providerName = createProviderName(
    pacticipantSuffix,
    endpoint,
    operation,
    process.env.PACT_VERSION
  )
  const consumerName = createConsumerName(
    pacticipantSuffix,
    process.env.PACT_VERSION
  )
  const providerBaseUrl = getProviderBaseUrl(process.env["API_DEPLOYMENT_METHOD"], endpoint, operation)
  const fileName = path.join(__dirname, "../pact/pacts", `${consumerName}-${providerName}.json`)

  const verifierOptions: VerifierOptions = {
    consumerVersionTags: [process.env.PACT_VERSION],
    provider: providerName,
    providerVersion: providerVersion,
    providerBaseUrl: providerBaseUrl,
    logLevel: "error",
    pactUrls: [fileName],
    customProviderHeaders: {
      "NHSD-Session-URID": "555254242106" // for user UID 656005750108
    },
    // use a request filter to inject a valid auth token at runtime
    requestFilter: (req, res, next) => {
      if (!req.headers["authorization"]) {
        next()
        return
      }
      if (!process.env.APIGEE_ENVIRONMENT.includes("sandbox")) {
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
  if (process.env.APIGEE_ENVIRONMENT !== "prod" || (endpoint !== "validate")) {
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

async function getAccessToken(): Promise<string> {
  if (!process.env.APIGEE_ENVIRONMENT.includes("sandbox")) {
    oAuth2Token = await getAuthToken()
  }
  return
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
