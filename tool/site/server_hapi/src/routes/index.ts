import statusRoutes from "./health/get-status"
import accessTokenRoutes from "./auth/login"
import sessionRoutes from "./state/session"
import editRoutes from "./prescribe/edit"
import signRoutes from "./prescribe/sign"
import sendRoutes from "./prescribe/send"

const authRoutes = [
  ...accessTokenRoutes
]

const stateRoutes = [
  ...sessionRoutes
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
