import * as React from "react"
import {Page} from "./components/page"
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
import {Environment} from "./services/environment"
import LogoutPage from "./pages/logoutPage"
import ConfigPage from "./pages/configPage"
import VerifyPage from "./pages/verifyPage"
import ComparePage from "./pages/comparePage"
import {PageFullWidth} from "./components/pageFullWidth"
import {PageContainer} from "./components/pageContainer"

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
        <Page>
          <BrowserRouter>
            <Switch>
              <Route path={`${baseUrl}/`}>
                <PageContainer>
                  <HomePage />
                </PageContainer>
              </Route>
              <Route path={`${baseUrl}config`}>
                <PageContainer>
                  <ConfigPage/>
                </PageContainer>
              </Route>
              <Route path={`${baseUrl}my-prescriptions`}>
                <PageContainer>
                  <MyPrescriptionsPage/>
                </PageContainer>
              </Route>
              <Route path={`${baseUrl}login`}>
                <PageContainer>
                  <LoginPage/>
                </PageContainer>
              </Route>
              <Route path={`${baseUrl}logout`}>
                <PageContainer>
                  <LogoutPage/>
                </PageContainer>
              </Route>
              <Route path={`${baseUrl}prescribe/load`}>
                <PageContainer>
                  <LoadPage/>
                </PageContainer>
              </Route>
              <Route path={`${baseUrl}prescribe/edit`}>
                <PageContainer>
                  <SendPreSignPage prescriptionId={urlParams.get("prescription_id")}/>
                </PageContainer>
              </Route>
              <Route path={`${baseUrl}prescribe/send`}>
                <PageContainer>
                  <SendPostSignPage token={urlParams.get("token")} state={urlParams.get("state")}/>
                </PageContainer>
              </Route>
              <Route path={`${baseUrl}prescribe/cancel`}>
                <PageContainer>
                  <CancelPage prescriptionId={urlParams.get("prescription_id")}/>
                </PageContainer>
              </Route>
              <Route path={`${baseUrl}dispense/release`}>
                <PageContainer>
                  <ReleasePage prescriptionId={urlParams.get("prescription_id")}/>
                </PageContainer>
              </Route>
              <Route path={`${baseUrl}dispense/verify`}>
                <PageContainer>
                  <VerifyPage prescriptionId={urlParams.get("prescription_id")} />
                </PageContainer>
              </Route>
              <Route path={`${baseUrl}dispense/return`}>
                <PageContainer>
                  <ReturnPage prescriptionId={urlParams.get("prescription_id")} />
                </PageContainer>
              </Route>
              <Route path={`${baseUrl}dispense/withdraw`}>
                <PageContainer>
                  <WithdrawPage prescriptionId={urlParams.get("prescription_id")} />
                </PageContainer>
              </Route>
              <Route path={`${baseUrl}dispense/dispense`}>
                <PageContainer>
                  <DispensePage prescriptionId={urlParams.get("prescription_id")} />
                </PageContainer>
              </Route>
              <Route path={`${baseUrl}dispense/claim`}>
                <PageContainer>
                  <ClaimPage prescriptionId={urlParams.get("prescription_id")}/>
                </PageContainer>
              </Route>
              <Route path={`${baseUrl}search`}>
                <PageContainer>
                  <PrescriptionSearchPage prescriptionId={urlParams.get("prescription_id")} />
                </PageContainer>
              </Route>
              <Route path={`${baseUrl}validate`}>
                <PageContainer>
                  <ValidatePage />
                </PageContainer>
              </Route>
              <Route path={`${baseUrl}compare-prescriptions`}>
                <PageFullWidth>
                  <ComparePage />
                </PageFullWidth>
              </Route>
            </Switch>
          </BrowserRouter>
        </Page>
      </CookiesProvider>
    </AppContext.Provider>
  )
  ReactDOM.render(content, document.getElementById("root"))
}

customWindow.startApplication = startApplication
