export type StructureDefinitionKind =
    // These are the basic, single-value data types built into the system (like String, Integer, etc)
    "primitive-type"

    // These are reusable data types that consist of multiple elements or properties grouped together.
    | "complex-type"

    // These are the primary, top-level objects in FHIR (like MedicationRequest)
    | "resource"

    // These represent structural frameworks or data models
    | "logical"
