import {Label} from "nhsuk-react-components"
import React from "react"
import {EditPrescriptionButton, EditPrescriptionProps} from "./EditPrescriptionButton"

export const PrescriptionSummaryViewLabel = ({editorProps}: { editorProps?: EditPrescriptionProps }) => (
  <Label isPageHeading>
    <span>Prescription Summary</span>
    {editorProps
      ? <EditPrescriptionButton
        editMode={editorProps.editMode}
        setEditMode={editorProps.setEditMode}
        errors={editorProps.errors} />
      : undefined
    }
  </Label>
)
