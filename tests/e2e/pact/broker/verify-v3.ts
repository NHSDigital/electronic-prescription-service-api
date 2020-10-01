import { VerifierV3 } from "@pact-foundation/pact"

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function verify(): Promise<any> { 
  const isLocal = process.env.PACT_PROVIDER_URL === "http://localhost:9000"
  const verifier =  new VerifierV3({
    publishVerificationResult: !isLocal,
    pactBrokerUrl: isLocal ? undefined : process.env.PACT_BROKER_URL,
    pactBrokerUsername: process.env.PACT_BROKER_BASIC_AUTH_USERNAME,
    pactBrokerPassword: process.env.PACT_BROKER_BASIC_AUTH_PASSWORD,
    consumerVersionTag: process.env.BUILD_VERSION,
    provider: `${process.env.PACT_PROVIDER}-convert+${process.env.BUILD_VERSION}`,
    providerVersion: process.env.BUILD_VERSION,
    providerBaseUrl: process.env.PACT_PROVIDER_URL,
    logLevel: isLocal? "debug" : "info",
    requestFilter: (req) => {
      req.headers["x-smoke-test"] = "1"
      req.headers["Authorization"] = `Bearer ${process.env.APIGEE_ACCESS_TOKEN}`
      return req
    },
    pactUrls: isLocal 
      ? [
        `${process.cwd()}/pact/pacts/${process.env.PACT_CONSUMER}+${process.env.BUILD_VERSION}-${process.env.PACT_PROVIDER}-convert+${process.env.BUILD_VERSION}.json`
      ]
      : []
  })
  
  return await verifier.verifyProvider()
}

(async () => {
  verify().catch(verify).catch(verify)
})()

