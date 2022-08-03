import {basePath, getHeaders, pactOptions} from "../../resources/common"
import {InteractionObject} from "@pact-foundation/pact"
import {Pact} from "@pact-foundation/pact"
import {fetcher, fhir} from "@models"
import * as LosslessJson from "lossless-json"

const provider = new Pact(pactOptions("sandbox", "verify-signature"))

test("verify-signature e2e tests", async () => {
  provider.setup().then(async () => {
    const innerBundles = [
      fetcher.prescriptionOrderExamples[0].request,
      fetcher.prescriptionOrderExamples[1].request,
      fetcher.prescriptionOrderExamples[2].request
    ]
    const outerBundle = createOuterBundle(innerBundles)
    const apiPath = `${basePath}/$verify-signature`
    const interaction: InteractionObject = {
      state: "is not authenticated",
      uponReceiving: "a valid FHIR message",
      withRequest: {
        headers: {
          ...getHeaders(),
          "X-Skip-Validation": "true"
        },
        method: "POST",
        path: apiPath,
        body: LosslessJson.stringify(outerBundle)
      },
      willRespondWith: {
        headers: {
          "Content-Type": "application/fhir+json; fhirVersion=4.0"
        },
        status: 200
      }
    }

    await provider.addInteraction(interaction)
    await provider.writePact()
  })
})

function createOuterBundle(bundles: Array<fhir.Bundle>): fhir.Bundle {
  return {
    resourceType: "Bundle",
    id: "0cb82cfa-76c8-4fb2-a08e-bf0e326e5487",
    identifier: {
      system: "https://tools.ietf.org/html/rfc4122",
      value: "be66584d-10da-4212-9c95-303b2a1c950b"
    },
    type: "searchset",
    entry: bundles.map(bundle => ({
      resource: bundle,
      fullUrl: "urn:uuid:bluh"
    }))
  }
}
