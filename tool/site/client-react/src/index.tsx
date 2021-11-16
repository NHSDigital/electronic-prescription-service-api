import * as React from "react"
import {PageContainer} from "./components/pageContainer"
import PrescriptionSummary from "./components/prescription-summary/prescriptionSummary"
import * as ReactDOM from "react-dom"
import {Button} from "nhsuk-react-components"
import {OperationOutcome} from "fhir/r4"
import axios from "axios"
import {BrowserRouter, Route, Switch} from "react-router-dom"
import ClaimPage from "./pages/claimPage"
import SearchPage from "./pages/searchPage"
import DispensePage from "./pages/dispensePage"
import ButtonList from "./components/buttonList"
import SendPage from "./pages/sendPage"
import {CookiesProvider} from "react-cookie"

const customWindow = window as Record<string, any>

interface signResponse {
  redirectUri?: string
  prepareErrors?: Array<OperationOutcome>
}

// TODO: move this to page/component
async function sendSignRequest(baseUrl: string) {
  try {
    const response = await axios.post<signResponse>(`${baseUrl}prescribe/sign`)
    if (response.data.prepareErrors) {
      const prepareErrors = response.data.prepareErrors
      prepareErrors
        .flatMap(error => error.issue)
        .filter(issue => issue.severity === "error")
        .filter(issue => !issue.diagnostics.startsWith("Unable to find matching profile for urn:uuid:"))
        .map(issue => issue.diagnostics)
        .forEach(diagnostic => console.log(diagnostic))
      // TODO display the above errors on ui
    } else if (response.data.redirectUri) {
      //TODO REACT redirect when router
      window.location.href = response.data.redirectUri
    } else {
      console.log(`Unable to sign prescription, this is most likely because your session has expired. Please try to change-auth or login again`)
    }
  } catch (e) {
    console.log(e)
  }
}

interface AppContext {
  baseUrl: string
}

export const AppContext = React.createContext<AppContext>({baseUrl: "/"})

async function startApplication(baseUrl: string): Promise<void> {
  const urlParams = new URLSearchParams(window.location.search)
  const content = (
    <AppContext.Provider value={{baseUrl}}>
      <CookiesProvider>
        <PageContainer>
          <BrowserRouter>
            <Switch>
              <Route path={`${baseUrl}prescribe/edit`}>
                <PrescriptionSummary
                  baseUrl={baseUrl}
                  prescriptionId={urlParams.get("prescription_id")}
                />
                <ButtonList>
                  <Button onClick={() => sendSignRequest(baseUrl)}>Send</Button>
                  <Button secondary href={baseUrl}>Back</Button>
                </ButtonList>
              </Route>
              <Route path={`${baseUrl}prescribe/send`}>
                <SendPage baseUrl={baseUrl} token={urlParams.get("token")}/>
              </Route>
              <Route path={`${baseUrl}dispense/dispense`}>
                <DispensePage baseUrl={baseUrl} prescriptionId={urlParams.get("prescription_id")}/>
              </Route>
              <Route path={`${baseUrl}dispense/claim`}>
                <ClaimPage baseUrl={baseUrl} prescriptionId={urlParams.get("prescription_id")}/>
              </Route>
              <Route path={`${baseUrl}search`}>
                <SearchPage baseUrl={baseUrl} prescriptionId={urlParams.get("prescription_id")}/>
              </Route>
            </Switch>
          </BrowserRouter>
        </PageContainer>
      </CookiesProvider>
    </AppContext.Provider>
  )
  ReactDOM.render(content, document.getElementById("root"))
}

customWindow.startApplication = startApplication
