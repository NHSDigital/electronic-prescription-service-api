import publisher, { PublisherOptions } from "@pact-foundation/pact-node";
import * as cp from "child_process";
import { resolve } from "path";

let version: string = "";
let branch: string = "";
let opts: PublisherOptions;
const PACT_BROKER_URL: string = process.env.PACT_BROKER_URL || "";
const PACT_BROKER_BASIC_AUTH_USERNAME: string = process.env.PACT_BROKER_BASIC_AUTH_USERNAME || "";
const PACT_BROKER_BASIC_AUTH_PASSWORD: string = process.env.PACT_BROKER_BASIC_AUTH_PASSWORD || "";
const PACT_BROKER_TOKEN: string = process.env.PACT_BROKER_TOKEN || "";

main();

function getOpts() {
  if (PACT_BROKER_TOKEN) {
    opts = {
      pactFilesOrDirs: [resolve(process.cwd(), "pact/pacts")],
      pactBroker: PACT_BROKER_URL,
      pactBrokerToken: PACT_BROKER_TOKEN,
      consumerVersion: version,
      tags: [branch]
    };
  }
  else {
    opts = {
      pactFilesOrDirs: [resolve(process.cwd(), "pact/pacts")],
      pactBroker: PACT_BROKER_URL,
      pactBrokerUsername: PACT_BROKER_BASIC_AUTH_USERNAME,
      pactBrokerPassword: PACT_BROKER_BASIC_AUTH_PASSWORD,
      consumerVersion: version,
      tags: [branch]
    };
  }
}

function main() {
  getBranch();
  getVersion();
  getOpts();
  performPublish();
}

function performPublish() {
  console.log(opts)

  publisher
    .publishPacts(opts)
    .then(() => {
      console.log("successfully published pacts");
      return process.exit(0);
    })
    .catch((error: any) => {
      console.log("failed to publish pacts");
      console.log(error)
      return process.exit(1);
    });
}

function getBranch() {
  branch = process.env.BUILD_SOURCE_BRANCH || ""
}

function getVersion() {
  branch = process.env.BUILD_VERSION || ""
}