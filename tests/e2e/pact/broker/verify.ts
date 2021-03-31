import {VerifierV3, VerifierV3Options} from "@pact-foundation/pact"
import {
  getPreparePactGroups,
  getProcessSendPactGroups,
  getProcessCancelPactGroups,
  getConvertPactGroups,
  getReleasePactGroups,
  ApiEndpoint,
  getProcessDispensePactGroups,
  getTaskPactGroups
} from "../resources/common"
import path from "path"

let token: string

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function verify(endpoint: string, pactGroupName: string): Promise<any> {
    const useBroker = process.env.PACT_USE_BROKER !== "false"
    const providerVersion = process.env.PACT_TAG
      ? `${process.env.PACT_VERSION} (${process.env.PACT_TAG})`
      : process.env.PACT_VERSION
    let verifierOptions: VerifierV3Options = {
      consumerVersionTag: process.env.PACT_VERSION,
      provider: `${process.env.PACT_PROVIDER}+${endpoint}${pactGroupName ? "-" + pactGroupName : ""}+${process.env.PACT_VERSION}`,
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
          `${path.join(__dirname, "../pact/pacts")}/nhsd-apim-eps-test-client+${process.env.PACT_VERSION}-${process.env.PACT_PROVIDER}+${endpoint}${pactGroupName ? "-" + pactGroupName : ""}+${process.env.PACT_VERSION}.json`
        ]
      }
    }

    const verifier =  new VerifierV3(verifierOptions)
    return await verifier.verifyProvider()
}

async function verifyOnce(endpoint: ApiEndpoint, pactGroupName: string) {
  await verify(endpoint, pactGroupName)
    .catch(() => process.exit(1))
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function verifyConvert(): Promise<any> {
  await getConvertPactGroups().reduce(async (promise, group) => {
    await promise
    await verifyOnce("convert", group)
  }, Promise.resolve())
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function verifyPrepare(): Promise<any> {
    await getPreparePactGroups().reduce(async (promise, group) => {
      await promise
      await verifyOnce("prepare", group)
    }, Promise.resolve())
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function verifyProcess(): Promise<any> {
    await getProcessSendPactGroups().reduce(async (promise, group) => {
      await promise
      await verifyOnce("process", group)
    }, Promise.resolve())

    await getProcessDispensePactGroups().reduce(async (promise, group) => {
      await promise
      await verifyOnce("process", `${group}-dispense`)
    }, Promise.resolve())

    await getProcessCancelPactGroups().reduce(async (promise, group) => {
      await promise
      await verifyOnce("process", `${group}-cancel`)
    }, Promise.resolve())
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function verifyRelease(): Promise<any> {
  await getReleasePactGroups().reduce(async (promise, group) => {
    await promise
    await verifyOnce("release", group)
  }, Promise.resolve())
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function verifyTask(): Promise<any> {
  await getTaskPactGroups().reduce(async (promise, group) => {
    await promise
    await verifyOnce("task", group)
  }, Promise.resolve())
}

(async () => {
  verifyConvert()
    .then(verifyPrepare)
    .then(verifyProcess)
    .then(verifyRelease)
    .then(verifyTask)
})()

