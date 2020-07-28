import {convertParentPrescription} from "../../../src/services/translation/parent-prescription";
import * as TestResources from "../../resources/test-resources";
import {xmlTest} from "../../resources/test-helpers";

test(
    "convertParentPrescription returns correct value for repeat prescription",
    xmlTest(
        convertParentPrescription(TestResources.examplePrescription1.fhirMessageSigned),
        TestResources.examplePrescription1.hl7V3ParentPrescription
    )
)

test(
    "convertParentPrescription returns correct value for acute prescription with nominated pharmacy",
    xmlTest(
        convertParentPrescription(TestResources.examplePrescription2.fhirMessageSigned),
        TestResources.examplePrescription2.hl7V3ParentPrescription
    )
)
