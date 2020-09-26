import path from "path"
import { Publisher } from "@pact-foundation/pact"

async function publish() { 
  await new Publisher({
    pactBroker: process.env.PACT_BROKER_URL,
    pactBrokerUsername: process.env.PACT_BROKER_BASIC_AUTH_USERNAME,
    pactBrokerPassword: process.env.PACT_BROKER_BASIC_AUTH_PASSWORD,
    consumerVersion: process.env.BUILD_VERSION,
    pactFilesOrDirs: [
      path.join(__dirname, "../pact/pacts")
    ]
  })
  .publishPacts()
}

publish()