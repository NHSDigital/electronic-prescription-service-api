import {HumanName} from "fhir/r4"
import {SummaryList} from "nhsuk-react-components"
import * as React from "react"

interface NameSummaryListRowProps {
  name: HumanName
}

function formatName(name: HumanName) {
  if (name.text) {
    return name.text
  }

  const prefix = name.prefix ?? []
  const suffix = name.suffix ?? []
  const otherNameFields = [
    ...name.given,
    ...prefix.map(prefix => `(${prefix})`),
    ...suffix.map(suffix => `(${suffix})`)
  ].filter(Boolean).join(" ")
  return [
    name.family?.toUpperCase(),
    otherNameFields
  ].filter(Boolean).join(", ")
}

export const NameSummaryListRow = ({name}: NameSummaryListRowProps): JSX.Element => {
  return (
    <SummaryList.Row>
      <SummaryList.Key>Name</SummaryList.Key>
      <SummaryList.Value>{formatName(name)}</SummaryList.Value>
    </SummaryList.Row>
  )
}
