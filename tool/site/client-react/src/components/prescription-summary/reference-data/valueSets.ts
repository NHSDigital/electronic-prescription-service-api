import {Coding} from "fhir/r4"

export enum COURSE_OF_THERAPY_TYPE_CODES {
  continuous = "continuous",
  acute = "acute",
  continuousRepeatDispensing = "continuous-repeat-dispensing"
}

export const VALUE_SET_COURSE_OF_THERAPY_TYPE: Array<Coding> = [
  {
    code: COURSE_OF_THERAPY_TYPE_CODES.continuous,
    system: "http://terminology.hl7.org/CodeSystem/medicationrequest-course-of-therapy",
    display: "Continuous long term therapy"
  },
  {
    code: COURSE_OF_THERAPY_TYPE_CODES.acute,
    system: "http://terminology.hl7.org/CodeSystem/medicationrequest-course-of-therapy",
    display: "Short course (acute) therapy"
  },
  {
    code: COURSE_OF_THERAPY_TYPE_CODES.continuousRepeatDispensing,
    system: "https://fhir.nhs.uk/CodeSystem/medicationrequest-course-of-therapy",
    display: "Continuous long term (repeat dispensing)"
  }
]

export const VALUE_SET_PROFESSIONAL_CODES: Array<Coding> = [
  {
    code: COURSE_OF_THERAPY_TYPE_CODES.continuous,
    system: "https://fhir.hl7.org.uk/Id/nmc-number",
    display: "Continuous long term therapy"
  },
  {
    code: COURSE_OF_THERAPY_TYPE_CODES.continuous,
    system: "https://fhir.hl7.org.uk/Id/nmc-number",
    display: "Continuous long term therapy"
  },
  {
    code: COURSE_OF_THERAPY_TYPE_CODES.continuous,
    system: "https://fhir.hl7.org.uk/Id/nmc-number",
    display: "Continuous long term therapy"
  },
  {
    code: COURSE_OF_THERAPY_TYPE_CODES.continuous,
    system: "https://fhir.hl7.org.uk/Id/nmc-number",
    display: "Continuous long term therapy"
  },
  {
    code: COURSE_OF_THERAPY_TYPE_CODES.continuous,
    system: "https://fhir.hl7.org.uk/Id/nmc-number",
    display: "Continuous long term therapy"
  },
  {
    code: COURSE_OF_THERAPY_TYPE_CODES.continuous,
    system: "https://fhir.hl7.org.uk/Id/nmc-number",
    display: "Continuous long term therapy"
  }
]
