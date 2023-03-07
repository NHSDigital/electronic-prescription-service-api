import * as React from "react"
import {FieldArrayRenderProps} from "formik/dist/FieldArray"
import {getIn} from "formik"
import Endorsement from "./endorsement"
import {Button} from "nhsuk-react-components"
import {EndorsementFormValues} from "./claimForm"
import ButtonList from "../common/buttonList"
import {VALUE_SET_DISPENSER_ENDORSEMENT} from "../../fhir/reference-data/valueSets"

const EndorsementArray: React.FC<FieldArrayRenderProps> = ({
  form,
  name,
  push,
  remove
}) => {
  const endorsements: Array<EndorsementFormValues> = getIn(form.values, name)
  return (
    <>
      {endorsements.map((endorsement, index) =>
        <Endorsement
          key= {`${name}.${endorsement.id}`}
          name={`${name}.${index}`}
          label={`Endorsement ${index + 1}`}
          removeEndorsement={() => remove(index)}
        />
      )}
      <ButtonList>
        <Button type="button" onClick={() => push(getInitialValues(endorsements.length))}>Add Endorsement</Button>
      </ButtonList>
    </>
  )
}

function getInitialValues(id?: number): EndorsementFormValues{
  return {
    id: id,
    code: VALUE_SET_DISPENSER_ENDORSEMENT[0].code,
    supportingInfo: ""
  }
}

export default EndorsementArray
