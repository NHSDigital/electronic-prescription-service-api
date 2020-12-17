import { VerifierV3 } from "@pact-foundation/pact"

let token: string

let sleepMs: number = 0

function sleep(milliseconds: number) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function verify(): Promise<any> { 
  return await ["convert", "prepare", "process"].map(endpoint => {
    sleep(sleepMs)
    sleepMs = (sleepMs + 5000) * 2
    const isLocal = process.env.PACT_PROVIDER_URL === "http://localhost:9000"
    const verifier =  new VerifierV3({
      publishVerificationResult: !isLocal,
      pactBrokerUrl: isLocal ? undefined : process.env.PACT_BROKER_NEXT_URL,
      pactBrokerToken: process.env.PACT_BROKER_NEXT_TOKEN,
      consumerVersionTag: process.env.PACT_VERSION,
      provider: `${process.env.PACT_PROVIDER}_${endpoint}+${process.env.PACT_VERSION}`,
      providerVersion: process.env.PACT_VERSION,
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
          `${process.cwd()}/pact/pacts/${process.env.PACT_CONSUMER}_convert+${process.env.PACT_VERSION}-${process.env.PACT_PROVIDER}+${process.env.PACT_VERSION}.json`,
          `${process.cwd()}/pact/pacts/${process.env.PACT_CONSUMER}_prepare+${process.env.PACT_VERSION}-${process.env.PACT_PROVIDER}+${process.env.PACT_VERSION}.json`,
          `${process.cwd()}/pact/pacts/${process.env.PACT_CONSUMER}_process+${process.env.PACT_VERSION}-${process.env.PACT_PROVIDER}+${process.env.PACT_VERSION}.json`
        ]
        : []
    })
    return verifier.verifyProvider()
  })
}

(async () => {  
    verify().catch(verify).catch(verify)
})()

