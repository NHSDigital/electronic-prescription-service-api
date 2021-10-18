import statusRoutes from "./health/get-status"
import accessTokenRoutes from "./auth/login"
import prescriptionIdRoutes from "./state/prescription-ids"
import editRoutes from "./prescribe/edit"
import signRoutes from "./prescribe/sign"
import sendRoutes from "./prescribe/send"

const authRoutes = [
  ...accessTokenRoutes
]

const stateRoutes = [
  ...prescriptionIdRoutes
]

const prescribeRoutes = [
  ...editRoutes,
  ...signRoutes,
  ...sendRoutes
]

const healthcheckRoutes = [
  ...statusRoutes
]

const routes = [
  ...authRoutes,
  ...stateRoutes,
  ...healthcheckRoutes,
  ...prescribeRoutes
]

export default routes
