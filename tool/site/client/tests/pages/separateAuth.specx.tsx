import {waitFor} from "@testing-library/react"
import {screen} from "@testing-library/dom"
import pretty from "pretty"
import * as React from "react"
import moxios from "moxios"
import ClaimPage, {getInitialValues} from "../../src/pages/claimPage"
import userEvent from "@testing-library/user-event"
import {readBundleFromFile, readClaimFromFile} from "../messages"
import {AppContextValue} from "../../src"
import {renderWithContext} from "../renderWithContext"
import {axiosInstance} from "../../src/requests/axiosInstance"
import {internalDev} from "../../src/services/environment"
import {StaticProductInfo} from "../../src/components/claim/claimForm"
import axios from "axios"

test("Displays loading text while prescription data is being requested", async () => {
      const redirectUri = encodeURI("https://int.api.service.nhs.uk/eps-api-tool/callback")
      const axiosResponse = await axios.get(`https://am.nhsint.auth-ptl.cis2.spineservices.nhs.uk:443/openam/oauth2/realms/root/realms/NHSIdentity/realms/Healthcare/authorize?client_id=128936811467.apps.national&redirect_uri=${redirectUri}&response_type=code&scope=openid%20profile&state=af0ifjsldkj`)
      console.log(axiosResponse.data)
})

