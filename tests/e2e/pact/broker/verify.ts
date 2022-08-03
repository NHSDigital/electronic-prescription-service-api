/* eslint-disable-next-line  @typescript-eslint/no-var-requires, @typescript-eslint/no-unused-vars */
const register = require("tsconfig-paths/register")
import {ApiEndpoint, ApiOperation} from "../resources/common"
import path from "path"
// note: using /pact-core as /pact does not yet have providerBaseUrl resulting in defaulting to locahost
import {Verifier} from "@pact-foundation/pact-core"
import {VerifierOptions} from "@pact-foundation/pact-core"
// pact-core does not currently support requestFilter to set auth tokens
// *****************************************************************************************************

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function verify(endpoint: string, operation?: string): Promise<any> {
  const useBroker = process.env.PACT_USE_BROKER !== "false"
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

  if (useBroker) {
    verifierOptions = {
      ...verifierOptions,
      publishVerificationResult: true,
      pactBrokerUrl: process.env.PACT_BROKER_URL,
      pactBrokerUsername: process.env.PACT_BROKER_BASIC_AUTH_USERNAME,
      pactBrokerPassword: process.env.PACT_BROKER_BASIC_AUTH_PASSWORD
    }
  } else {
    const pacticipant_suffix = process.env.APIGEE_ENVIRONMENT?.includes("sandbox") ? "-sandbox" : ""
    verifierOptions = {
      ...verifierOptions,
      pactUrls: [
        // eslint-disable-next-line max-len
        `${path.join(__dirname, "../pact/pacts")}/nhsd-apim-eps-test-client${pacticipant_suffix}+${process.env.PACT_VERSION}-${process.env.PACT_PROVIDER}+${endpoint}${operation ? "-" + operation : ""}+${process.env.PACT_VERSION}.json`
      ]
    }
  }

  const verifier = new Verifier(verifierOptions)
  return await verifier.verify()
}

async function verifyOnce(endpoint: ApiEndpoint, operation?: ApiOperation) {
  // debug endpoints not available in prod
  if (process.env.APIGEE_ENVIRONMENT !== "prod" || (endpoint !== "validate")) {
    await verify(endpoint, operation)
      .catch(() => process.exit(1))
  }
}

// async function verifyValidate(): Promise<void> {
//   await verifyOnce("validate")
// }

// async function verifyVerifySignatures(): Promise<void> {
//   await verifyOnce("verify-signature")
// }

async function verifyPrepare(): Promise<void> {
  await verifyOnce("prepare")
}

async function verifySend(): Promise<void> {
  await verifyOnce("process", "send")
}

// async function verifyCancel(): Promise<void> {
//   await verifyOnce("process", "cancel")
// }

// async function verifyRelease(): Promise<void> {
//   await verifyOnce("task", "release")
// }

// async function verifyDispense(): Promise<void> {
//   await verifyOnce("process", "dispense")
// }

// async function verifyDispenseAmend(): Promise<void> {
//   await verifyOnce("process", "dispenseamend")
// }

// async function verifyReturn(): Promise<void> {
//   await verifyOnce("task", "return")
// }

// async function verifyWithdraw(): Promise<void> {
//   await verifyOnce("task", "withdraw")
// }

// async function verifyClaim(): Promise<void> {
//   await verifyOnce("claim")
// }

// async function verifyClaimAmend(): Promise<void> {
//   await verifyOnce("claim", "amend")
// }

async function verifyMetadata(): Promise<void> {
  await verifyOnce("metadata")
}

(async () => {
  await verifyMetadata()
    .then(verifyPrepare)
    .then(verifySend)
  // .then(verifyCancel)
  // .then(verifyRelease)
  // .then(verifyReturn)
  // .then(verifyDispense)
  // .then(verifyDispenseAmend)
  // .then(verifyWithdraw)
  // .then(verifyClaim)
  // .then(verifyClaimAmend)
  // .then(verifyVerifySignatures)
  // .then(verifyValidate)
})()
