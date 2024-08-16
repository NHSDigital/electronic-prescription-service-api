/* eslint-disable-next-line  @typescript-eslint/no-unused-vars */
import register from "tsconfig-paths/register"
import {ApiEndpoint, ApiOperation} from "../resources/common"
import path from "path"
// note: using /pact-core as /pact does not yet have providerBaseUrl resulting in defaulting to locahost
import {Verifier, VerifierOptions} from "@pact-foundation/pact-core"
// pact-core does not currently support requestFilter to set auth tokens
// *****************************************************************************************************

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function verify(endpoint: string, operation?: string): Promise<any> {
  const providerVersion = process.env.PACT_TAG
    ? `${process.env.PACT_VERSION} (${process.env.PACT_TAG})`
    : process.env.PACT_VERSION
  let verifierOptions: VerifierOptions = {
    consumerVersionTags: [process.env.PACT_VERSION],
    provider: `${process.env.PACT_PROVIDER}+${endpoint}${operation ? "-" + operation : ""}+${process.env.PACT_VERSION}`,
    providerVersion: providerVersion,
    providerBaseUrl: process.env.PACT_PROVIDER_URL,
    logLevel: "error"
  }

  const pacticipant_suffix = process.env.APIGEE_ENVIRONMENT?.includes("sandbox") ? "-sandbox" : ""
  verifierOptions = {
    ...verifierOptions,
    pactUrls: [
      // eslint-disable-next-line max-len
      `${path.join(__dirname, "../pact/pacts")}/nhsd-apim-eps-test-client${pacticipant_suffix}+${process.env.PACT_VERSION}-${process.env.PACT_PROVIDER}+${endpoint}${operation ? "-" + operation : ""}+${process.env.PACT_VERSION}.json`
    ],
    // Healthcare worker role from /userinfo endpoint, i.e.
    // https://<environment>.api.service.nhs.uk/oauth2-mock/userinfo
    customProviderHeaders: {
      "NHSD-Session-URID": "555254242106" // for user UID 656005750108
    }
  }

  const verifier = new Verifier(verifierOptions)
  return await verifier.verify()
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

(async () => {
  await verifyMetadata()
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
