import statusRoutes from "./health/get-status"
import accessTokenRoutes from "./auth/login"
import editRoutes from "./prescribe/edit"
import signRoutes from "./prescribe/sign"
import sendRoutes from "./prescribe/send"

const authRoutes = [
  ...accessTokenRoutes
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
  ...healthcheckRoutes,
  ...prescribeRoutes
]

export default routes
