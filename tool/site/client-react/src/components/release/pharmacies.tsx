import * as React from "react"
import {Input} from "nhsuk-react-components"
import {Field} from "formik"
import RadioField from "../../components/radioField"

interface PharmacyProps {
  label: string
  value?: string
  error?: string
}

interface Pharamcy {
  odsCode: string
  name: string
}

const pharmacies: Array<Pharamcy> = [
  {
    odsCode: "VNFKT",
    name: "FIVE STAR HOMECARE LEEDS LTD"
  },
  {
    odsCode: "YGM1E",
    name: "MBBM HEALTHCARE TECHNOLOGIES LTD"
  }
]

const PharmacyRadios: React.FC<PharmacyProps> = ({
  label,
  value,
  error
}) => {
  return (
    <>
      <RadioField
        name="pharmacy"
        label={label}
        error={error}
        fieldRadios={[
          ...pharmacies.map(p => {
            return {
              value: p.odsCode,
              text: `${p.odsCode} - ${p.name}`
            }
          }),
          {
            value: "custom",
            text: "Other"
          }
        ]}
      />
      {value === "custom" &&
          <Field
            id="customPharmacy"
            name="customPharmacy"
            as={Input}
            width={30}
            label="Enter an ODS Code"
          />
      }
    </>
  )
}

export default PharmacyRadios
