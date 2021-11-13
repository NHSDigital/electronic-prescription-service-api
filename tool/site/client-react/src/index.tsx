import * as React from "react"
import {PageContainer} from "./components/pageContainer"
import PrescriptionSummaryPage from "./pages/prescriptionSummaryPage"
import * as ReactDOM from "react-dom"
import {BrowserRouter, Route, Switch} from "react-router-dom"
import ClaimPage from "./pages/claimPage"
import DispensePage from "./pages/dispensePage"
import SendPage from "./pages/sendPage"
import PrescriptionSearchPage from "./pages/prescriptionSearchPage"

const customWindow = window as Record<string, any>

export interface AppContextValue {
  baseUrl: string
}

export const AppContext = React.createContext<AppContextValue>({baseUrl: "/"})

async function startApplication(baseUrl: string): Promise<void> {
  const urlParams = new URLSearchParams(window.location.search)
  const content = (
    <AppContext.Provider value={{baseUrl}}>
      <PageContainer>
        <BrowserRouter>
          <Switch>
            <Route path={`${baseUrl}prescribe/edit`}>
              <PrescriptionSummaryPage prescriptionId={urlParams.get("prescription_id")}/>
            </Route>
            <Route path={`${baseUrl}prescribe/send`}>
              <SendPage token={urlParams.get("token")}/>
            </Route>
            <Route path={`${baseUrl}dispense/dispense`}>
              <DispensePage prescriptionId={urlParams.get("prescription_id")}/>
            </Route>
            <Route path={`${baseUrl}dispense/claim`}>
              <ClaimPage prescriptionId={urlParams.get("prescription_id")}/>
            </Route>
            <Route path={`${baseUrl}search`}>
              <PrescriptionSearchPage prescriptionId={urlParams.get("prescription_id")}/>
            </Route>
          </Switch>
        </BrowserRouter>
      </PageContainer>
    </AppContext.Provider>
  )
  ReactDOM.render(content, document.getElementById("root"))
}

customWindow.startApplication = startApplication
