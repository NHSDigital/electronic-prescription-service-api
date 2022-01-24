import statusRoutes from "./health/get-status"
import setSessionRoute from "./auth/set-session"
import getUnattendedAccessTokenRoute from "./auth/get-unattended-access-token"
import sessionRoutes from "./state/session"
import editRoutes from "./prescribe/edit"
import signRoutes from "./prescribe/sign"
import sendRoutes from "./prescribe/send"
import cancelRoutes from "./prescribe/cancel"
import validatorRoutes from "./validate/validator"
import searchRoutes from "./tracker/search"
import releaseRoutes from "./dispense/release"
import returnRoutes from "./dispense/return"
import dispenseRoutes from "./dispense/dispense"
import claimRoutes from "./dispense/claim"

const authRoutes = [
  setSessionRoute,
  getUnattendedAccessTokenRoute
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
  ...returnRoutes,
  ...dispenseRoutes,
  ...claimRoutes
]

const trackerRoutes = [
  ...searchRoutes
]

const healthcheckRoutes = [
  ...statusRoutes
]

const routes = [
  ...authRoutes,
  ...stateRoutes,
  ...healthcheckRoutes,
  ...prescribingRoutes,
  ...validateRoutes,
  ...dispensingRoutes,
  ...trackerRoutes
]

export default routes
