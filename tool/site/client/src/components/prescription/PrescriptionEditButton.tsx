import React, {useContext} from "react"
import {Field} from "formik"
import {Images, Input, Label} from "nhsuk-react-components"
import styled from "styled-components"
import {AppContext} from "../.."

const StyledImages = styled(Images)`
  width: 50px;
  margin-left: 25px;
  float: right;
  margin-top: -50px;
`

interface PrescriptionSummaryErrors {
    numberOfCopies?: string
}

interface PrescriptionEditButtonProps {
    editMode: boolean,
    setEditMode: React.Dispatch<React.SetStateAction<boolean>>
    errors: PrescriptionSummaryErrors
}

const PrescriptionEditButton = ({
  editMode,
  setEditMode,
  errors
}: PrescriptionEditButtonProps) => {
  const {baseUrl} = useContext(AppContext)

  return (
    <>
      {!editMode
        ? <StyledImages
          id="editPrescription"
          onClick={() => setEditMode(true)}
          srcSet={`${baseUrl}static/BlackTie_Bold_full_set_Pencil_SVG_Blue.svg`}
          sizes="50px"
        />
        : <div style={{float: "right", width: "300px"}}>
          <Label>How many copies do you want?</Label>
          <Field
            id="numberOfCopies"
            name="numberOfCopies"
            as={Input}
            width={500}
            error={errors.numberOfCopies}
          />
        </div>
      }
    </>
  )
}

export {
  PrescriptionEditButton
}
