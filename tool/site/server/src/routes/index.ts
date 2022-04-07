import statusRoutes from "./health/get-status"
import loginRoute from "./auth/login"
import oauthCallbackRoute from "./auth/callback"
import refreshRoute from "./auth/refresh"
import logoutRoute from "./auth/logout"
import configRoutes from "./config/config"
import sessionRoutes from "./state/session"
import editRoutes from "./prescribe/edit"
import signRoutes from "./prescribe/sign"
import sendRoutes from "./prescribe/send"
import cancelRoutes from "./prescribe/cancel"
import validatorRoutes from "./validate/validator"
import searchRoutes from "./tracker/tracker"
import releaseRoutes from "./dispense/release"
import verifyRoutes from "./dispense/verify"
import returnRoutes from "./dispense/return"
import dispenseRoutes from "./dispense/dispense"
import claimRoutes from "./dispense/claim"
import withdrawRoutes from "./dispense/withdraw"
import comparePrescriptions from "./api/comparePrescriptions"
import {isSandbox} from "../services/environment"
import {CONFIG} from "../config"

const authRoutes = [
  loginRoute,
  oauthCallbackRoute,
  refreshRoute,
  logoutRoute
]

const apiRoutes = [
  ...comparePrescriptions
]

const stateRoutes = [
  ...sessionRoutes
]

const prescribingRoutes = [
  ...editRoutes,
  ...signRoutes,
  ...sendRoutes,
  ...cancelRoutes
]

const validateRoutes = [
  ...validatorRoutes
]

const dispensingRoutes = [
  ...releaseRoutes,
  ...verifyRoutes,
  ...returnRoutes,
  ...dispenseRoutes,
  ...claimRoutes,
  ...withdrawRoutes
]

const trackerRoutes = [
  ...searchRoutes
]

const healthcheckRoutes = [
  ...statusRoutes
]

const routes = isSandbox(CONFIG.environment)
  ? []
  : [
    configRoutes,
    ...authRoutes,
    ...apiRoutes,
    ...stateRoutes,
    ...healthcheckRoutes,
    ...prescribingRoutes,
    ...validateRoutes,
    ...dispensingRoutes,
    ...trackerRoutes
  ]

export default routes
