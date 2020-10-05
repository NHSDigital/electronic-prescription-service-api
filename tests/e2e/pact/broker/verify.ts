import { Verifier } from "@pact-foundation/pact"

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function verify(): Promise<any> {
  const isLocal = process.env.PACT_PROVIDER_URL === "http://localhost:9000" 
  const verifier =  new Verifier({
    publishVerificationResult: !isLocal,
    pactBrokerUrl: isLocal ? undefined : process.env.PACT_BROKER_URL,
    pactBrokerUsername: process.env.PACT_BROKER_BASIC_AUTH_USERNAME,
    pactBrokerPassword: process.env.PACT_BROKER_BASIC_AUTH_PASSWORD,
    consumerVersionSelectors: [
      {
        pacticipant: `${process.env.PACT_CONSUMER}+${process.env.PACT_VERSION}`,
        version: process.env.PACT_VERSION,
        latest: false,
        all: false
      }
    ],
    provider: `${process.env.PACT_PROVIDER}+${process.env.PACT_VERSION}`,
    providerVersion: process.env.PACT_VERSION,
    providerBaseUrl: process.env.PACT_PROVIDER_URL,
    logLevel: isLocal? "debug" : "info",
    customProviderHeaders: [
      "x-smoke-test: 1",
      `Authorization: Bearer ${process.env.APIGEE_ACCESS_TOKEN}`
    ],
    pactUrls: isLocal 
      ? [
        `${process.cwd()}//pact/pacts/${process.env.PACT_CONSUMER}+${process.env.PACT_VERSION}-${process.env.PACT_PROVIDER}+${process.env.PACT_VERSION}.json`
      ]
      : []
  })
  
  return await verifier.verifyProvider()
}

(async () => {
  verify().catch(verify).catch(verify)
})()

