import { Verifier } from "@pact-foundation/pact"

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function verify(provider: string): Promise<any> { 
  const verifier =  new Verifier({
    publishVerificationResult: process.env.PACT_PUBLISH_VERIFICATION_RESULTS === "true",
    pactBrokerUrl: process.env.PACT_BROKER_URL,
    pactBrokerUsername: process.env.PACT_BROKER_BASIC_AUTH_USERNAME,
    pactBrokerPassword: process.env.PACT_BROKER_BASIC_AUTH_PASSWORD,
    consumerVersionSelectors: [
      {
        pacticipant: `${process.env.PACT_CONSUMER}+${process.env.BUILD_VERSION}`,
        version: process.env.BUILD_VERSION,
        latest: false,
        all: false
      }
    ],
    provider: `${provider}+${process.env.BUILD_VERSION}`,
    providerVersion: process.env.BUILD_VERSION,
    providerBaseUrl: process.env.PACT_PROVIDER_URL,
    logLevel: "info",
    customProviderHeaders: [
      "x-smoke-test: 1",
      `Authorization: Bearer ${process.env.APIGEE_ACCESS_TOKEN}`
    ]
  })
  
  return await verifier.verifyProvider()
}

(async () => {
  verify(process.env.PACT_PROVIDER).catch(console.error)
})()

