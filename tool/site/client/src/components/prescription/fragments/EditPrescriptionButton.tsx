import React, {useContext} from "react"
import {Images} from "nhsuk-react-components"
import styled from "styled-components"
import {AppContext} from "../../.."
import {NumberOfCopiesField} from "./EditableFields"

const StyledImages = styled(Images)`
  width: 50px;
  margin-left: 25px;
  float: right;
  margin-top: -50px;
`

interface EditPrescriptionErrors {
  numberOfCopies?: string
}

interface EditPrescriptionProps {
  editMode: boolean
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>
  errors?: EditPrescriptionErrors
}

const EditPrescriptionButton = ({
  editMode,
  setEditMode,
  errors
}: EditPrescriptionProps) => {
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
        : <NumberOfCopiesField errors={errors.numberOfCopies} />
      }
    </>
  )
}

export {
  EditPrescriptionButton,
  EditPrescriptionProps
}
