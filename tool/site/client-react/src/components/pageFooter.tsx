import * as React from "react"
import {useContext, useEffect, useState} from "react"
import {Footer} from "nhsuk-react-components"
import {AppContext} from "../index"
import {axiosInstance} from "../requests/axiosInstance"

interface Status {
  eps: Array<Check>
  signingService: Array<Check>
  validator: Array<Check>
}

interface Check {
  version: string
}

interface SoftwareVersions {
  eps: string
  signingService: string
  validator: string
}

export const PageFooter: React.FC = () => {
  const {baseUrl} = useContext(AppContext)

  const [softwareVersions, setSoftwareVersions] = useState<SoftwareVersions>()

  useEffect(() => {
    if (!softwareVersions) {
      (async() => {
        const statusResult = await (await axiosInstance.get<Status>(`${baseUrl}_healthcheck`)).data
        console.log(JSON.stringify(statusResult))
        setSoftwareVersions({
          eps: statusResult.eps[0].version,
          signingService: statusResult.signingService[0].version,
          validator: statusResult.validator[0].version})
      })()
    }
  }, [baseUrl, softwareVersions])

  return (
    <Footer>
      {softwareVersions &&
        <Footer.List>
          <Footer.ListItem>EPS: {softwareVersions.eps}</Footer.ListItem>
          <Footer.ListItem>Signing-Service: {softwareVersions.signingService}</Footer.ListItem>
          <Footer.ListItem>Validator: {softwareVersions.validator}</Footer.ListItem>
        </Footer.List>
      }
      <Footer.Copyright>&copy; Crown copyright</Footer.Copyright>
    </Footer>
  )
}
