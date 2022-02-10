import * as React from "react"
import {PageContainer} from "./components/pageContainer"
import SendPreSignPage from "./pages/sendPreSignPage"
import * as ReactDOM from "react-dom"
import {BrowserRouter, Route, Switch} from "react-router-dom"
import ClaimPage from "./pages/claimPage"
import DispensePage from "./pages/dispensePage"
import {CookiesProvider} from "react-cookie"
import SendPostSignPage from "./pages/sendPostSignPage"
import HomePage from "./pages/homePage"
import PrescriptionSearchPage from "./pages/prescriptionSearchPage"
import ReleasePage from "./pages/releasePage"
import CancelPage from "./pages/cancelPage"
import MyPrescriptionsPage from "./pages/myPrescriptionsPage"
import LoginPage from "./pages/loginPage"
import ValidatePage from "./pages/validatePage"
import ReturnPage from "./pages/returnPage"
import WithdrawPage from "./pages/withdrawPage"
import LoadPage from "./pages/loadPage"
import {Environment, isDev} from "./services/environment"
import LogoutPage from "./pages/logoutPage"
import ConfigPage from "./pages/configPage"

const customWindow = window as Record<string, any>

export interface AppContextValue {
  baseUrl: string
  environment: Environment
}

export const AppContext = React.createContext<AppContextValue>({baseUrl: "/", environment: "int"})

async function startApplication(baseUrl: string, environment: Environment): Promise<void> {
  const urlParams = new URLSearchParams(window.location.search)
  const content = (
    <AppContext.Provider value={{baseUrl, environment}}>
      <CookiesProvider>
        <PageContainer>
          <BrowserRouter>
            <Switch>
              <Route path={`${baseUrl}/`}>
                <HomePage/>
              </Route>
              <Route path={`${baseUrl}config`}>
                <ConfigPage/>
              </Route>
              <Route path={`${baseUrl}my-prescriptions`}>
                <MyPrescriptionsPage/>
              </Route>
              <Route path={`${baseUrl}login`}>
                <LoginPage/>
              </Route>
              <Route path={`${baseUrl}logout`}>
                <LogoutPage/>
              </Route>
              <Route path={`${baseUrl}prescribe/load`}>
                <LoadPage/>
              </Route>
              <Route path={`${baseUrl}prescribe/edit`}>
                <SendPreSignPage prescriptionId={urlParams.get("prescription_id")}/>
              </Route>
              <Route path={`${baseUrl}prescribe/send`}>
                <SendPostSignPage token={urlParams.get("token")}/>
              </Route>
              <Route path={`${baseUrl}prescribe/cancel`}>
                <CancelPage prescriptionId={urlParams.get("prescription_id")}/>
              </Route>
              <Route path={`${baseUrl}dispense/release`}>
                <ReleasePage prescriptionId={urlParams.get("prescription_id")}/>
              </Route>
              <Route path={`${baseUrl}dispense/return`}>
                <ReturnPage prescriptionId={urlParams.get("prescription_id")}/>
              </Route>
              <Route path={`${baseUrl}dispense/withdraw`}>
                <WithdrawPage prescriptionId={urlParams.get("prescription_id")}/>
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
              <Route path={`${baseUrl}validate`}>
                <ValidatePage/>
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
