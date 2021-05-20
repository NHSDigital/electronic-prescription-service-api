import path from "path"
import {Publisher} from "@pact-foundation/pact"

async function publish(): Promise<Array<string>> {
  const useBroker = process.env.PACT_USE_BROKER !== "false"
  if (useBroker) {
    return await new Publisher({
      // use the below if you want to try a new broker without
      // impacting other deploys until merged in
      // then switch over variables in ADO
      // pactBroker: process.env.PACT_BROKER_NEXT_URL,
      // pactBrokerToken: process.env.PACT_BROKER_NEXT_TOKEN,
      pactBroker: process.env.PACT_BROKER_URL,
      pactBrokerUsername: process.env.PACT_BROKER_BASIC_AUTH_USERNAME,
      pactBrokerPassword: process.env.PACT_BROKER_BASIC_AUTH_PASSWORD,
      consumerVersion: process.env.PACT_VERSION,
      tags: [process.env.PACT_VERSION],
      pactFilesOrDirs: [
        path.join(__dirname, "../pact/pacts")
      ]
    })
      .publishPacts()
  }
  return Promise.resolve([])
}

(async () => {
  publish().catch(publish).catch(publish)
})()
