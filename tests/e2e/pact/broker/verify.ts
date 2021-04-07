import {VerifierV3, VerifierV3Options} from "@pact-foundation/pact"
import {ApiEndpoint, ApiOperation, processMessageOperations, taskOperations} from "../resources/common"
import path from "path"

let token: string

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function verify(endpoint: string, operation?: string): Promise<any> {
    const useBroker = process.env.PACT_USE_BROKER !== "false"
    const providerVersion = process.env.PACT_TAG
      ? `${process.env.PACT_VERSION} (${process.env.PACT_TAG})`
      : process.env.PACT_VERSION
    let verifierOptions: VerifierV3Options = {
      consumerVersionTags: process.env.PACT_VERSION,
      provider: `${process.env.PACT_PROVIDER}+${endpoint}${operation ? "-" + operation : ""}+${process.env.PACT_VERSION}`,
      providerVersion: providerVersion,
      providerBaseUrl: process.env.PACT_PROVIDER_URL,
      logLevel: "debug",
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
      }
    }

    if (useBroker) {
      verifierOptions = {
        ...verifierOptions,
        publishVerificationResult: true,
        // use the below if you want to try a new broker without
        // impacting other deploys until merged in
        // then switch over variables in ADO
        // pactBrokerUrl: process.env.PACT_BROKER_NEXT_URL,
        // pactBrokerToken: process.env.PACT_BROKER_NEXT_TOKEN,
        pactBrokerUrl: process.env.PACT_BROKER_URL,
        pactBrokerUsername: process.env.PACT_BROKER_BASIC_AUTH_USERNAME,
        pactBrokerPassword: process.env.PACT_BROKER_BASIC_AUTH_PASSWORD,
      }
    }
    else {
      verifierOptions = {
        ...verifierOptions,
        pactUrls: [
          // eslint-disable-next-line max-len
          `${path.join(__dirname, "../pact/pacts")}/nhsd-apim-eps-test-client+${process.env.PACT_VERSION}-${process.env.PACT_PROVIDER}+${endpoint}${operation ? "-" + operation : ""}+${process.env.PACT_VERSION}.json`
        ]
      }
    }

    const verifier =  new VerifierV3(verifierOptions)
    return await verifier.verifyProvider()
}

async function verifyOnce(endpoint: ApiEndpoint, operation?: ApiOperation) {
  await verify(endpoint, operation)
    .catch(() => process.exit(1))
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function verifyConvert(): Promise<any> {
    await verifyOnce("convert")
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function verifyPrepare(): Promise<any> {
  await verifyOnce("prepare")
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function verifyProcess(): Promise<any> {
    await processMessageOperations.reduce(async (promise, operation) => {
      await promise
      await verifyOnce("process", operation)
    }, Promise.resolve())
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function verifyTask(): Promise<any> {
  await taskOperations.reduce(async (promise, operation) => {
    await promise
    await verifyOnce("task", operation)
  }, Promise.resolve())
}

(async () => {
  await verifyConvert()
    .then(verifyPrepare)
    .then(verifyProcess)
    .then(verifyTask)
})()
