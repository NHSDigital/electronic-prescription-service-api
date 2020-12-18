import * as fs from 'fs'
import * as path from "path"

// Environment

const url = process.env.PACT_PROVIDER_URL

// Collection

function createPostmanCollection() {
    const pactFiles = fs.readdirSync(path.join(__dirname, "pact/pacts"))
    const pactInteractions = pactFiles.flatMap(pactFile => JSON.parse(fs.readFileSync(path.join(__dirname, "pact/pacts", pactFile), "utf8")).interactions)

    const postmanCollection = {
        info: {
            name: "Electronic Prescription Service API",
            schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
          },
          item: []
    }

    const postmanItems = pactInteractions.map(interaction => createPostmanItem(interaction))

    postmanCollection.item = postmanItems

    const postmanCollectionString = JSON.stringify(postmanCollection, null, 2)
    fs.writeFileSync(path.join(__dirname, "../postman/collections/electronic-prescription-service-collection.json"), postmanCollectionString)
}

// Collection Items

function createPostmanItem(interaction) {
    const item = {
        name: interaction.description,
        request: {
            method: interaction.request.method,
            header: [],
            body: {
                mode: 'raw',
                raw: JSON.stringify(interaction.request.body, null, 2)
            },
            url: {
                raw: `${url}${interaction.request.path}`,
                host: [ `${url}`],
                path: interaction.request.path.split('/'),
                query: []
            }
        },
        response: [],
        event: getTests(interaction)
    }

    for (const [key, value] of Object.entries(interaction.request.headers)) {
        item.request.header.push({key, value})
    }

    return item
}

// Events (Tests)

function getTests(interaction: any) {
    return isControlledDrugWithAdditionalInstructionTest(interaction)
        ? [controlledDrugsWithAdditionalInstructions(interaction)]
        : []
}

// Test Type

function isControlledDrugWithAdditionalInstructionTest(interaction): Boolean {
    return interaction.request.path === "/$convert" 
        && interaction.request.body.entry.some(e => e.resource.resourceType === "CommunicationRequest")
        && interaction.request.body.entry
            .filter(e => e.resource.resourceType === "MedicationRequest")
            .flatMap(e => e.resource.extension)
            .filter(Boolean)
            .some(ex => ex.url === "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ControlledDrug")
}

// Test

function controlledDrugsWithAdditionalInstructions(interaction) {
    const medicationRequests = interaction.request.body.entry.filter(e => e.resource.resourceType === "MedicationRequest")
    const firstMedicationRequest = medicationRequests[0]
    const communicationRequest = interaction.request.body.entry.find(e => e.resource.resourceType === "CommunicationRequest")
    const additionalInstructions1 = communicationRequest.resource.payload[0].contentString
    const additionalInstructions2 = firstMedicationRequest
        .resource.extension
        .find(ex => ex.url === "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ControlledDrug")
        .extension
        .find(ext => ext.url === "quantityWords")
        .valueString
    let additionalInstructions3 = firstMedicationRequest
        .resource.dosageInstruction
        .find(d => d.patientInstruction)
        ?.patientInstruction
    additionalInstructions3 = additionalInstructions3
        ? "\\n" + additionalInstructions3
        : ""

    return {
        listen: "test",
        script: {
            exec: [
                "console.log('base_url: ' + pm.environment.get('base_url'));\r",
                "\r",
                "console.log(\"Controlled Drugs Section -Extension-controlled-drug-quantity-words\");\r",
                "\r",
                "pm.test(\"Status code is 200\", function () {\r",
                "    pm.response.to.have.status(200);\r",
                "});\r",
                "\r",
                "pm.test(\"Body matches and contains pertinentAdditionalInstructions \", function () {\r",
                "    pm.expect(pm.response.text()).to.include(\"pertinentAdditionalInstructions\");\r",
                "});\r",
                "\r",
                "\r",
                "pm.test(\"pertinentAdditionalInstructions (Element Attribute)\", \r",
                "    function () {\r",
                "        const $ = cheerio.load(pm.response.text(), {\r",
                "            normalizeWhitespace: true,\r",
                "            xmlMode: true\r",
                "        });\r",
                "    \r",
                "        let name = $('ParentPrescription > pertinentInformation1 > pertinentPrescription > responsibleParty > AgentPerson > representedOrganization > name').text();\r",
                "\r",
                "        pm.expect(name).to.eql('SOMERSET BOWEL CANCER SCREENING CENTRE');\r",
                "    }\r",
                ");\r",
                "\r",
                "pm.test(\"pertinentAdditionalInstructions value is AI (Element Attribute)\", \r",
                "    function () {\r",
                "        const $ = cheerio.load(pm.response.text(), {\r",
                "            normalizeWhitespace: true,\r",
                "            xmlMode: true\r",
                "        });\r",
                "    \r",
                "        let code = $('ParentPrescription > pertinentInformation1 > pertinentPrescription > pertinentInformation2 > pertinentLineItem > pertinentInformation1 > pertinentAdditionalInstructions > code').attr('code');\r",
                "\r",
                "\r",
                "        pm.expect(code).to.eql('AI');\r",
                "    }\r",
                ");\r",
                "\r",
                "pm.test(\"pertinentAdditionalInstructions value is correct \", \r",
                "    function () {\r",
                "        const $ = cheerio.load(pm.response.text(), {\r",
                "            normalizeWhitespace: false,\r",
                "            xmlMode: true\r",
                "        });\r",
                "    \r",
                "        let value = $('ParentPrescription > pertinentInformation1 > pertinentPrescription > pertinentInformation2 > pertinentLineItem > pertinentInformation1 > pertinentAdditionalInstructions > value').first().text();\r",
                "\r",
                "\r",
                "        pm.expect(value).to.eql('<patientInfo>"+additionalInstructions1+"</patientInfo>CD: "+additionalInstructions2+additionalInstructions3+"');\r",
                "    }\r",
                ");\r",
                "\r",
                ""
            ],
            type: "text/javascript"
        }
    }
}

createPostmanCollection()