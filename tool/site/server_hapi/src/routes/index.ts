import statusRoutes from "./health/get-status"
import accessTokenRoutes from "./auth/login"
import sessionRoutes from "./state/session"
import editRoutes from "./prescribe/edit"
import signRoutes from "./prescribe/sign"
import sendRoutes from "./prescribe/send"
import cancelRoutes from "./prescribe/cancel"
import validatorRoutes from "./validate/validator"
import searchRoutes from "./tracker/search"
import releaseRoutes from "./dispense/release"
import dispenseRoutes from "./dispense/dispense"
import claimRoutes from "./dispense/claim"

const authRoutes = [
  ...accessTokenRoutes
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
