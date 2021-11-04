import statusRoutes from "./health/get-status"
import accessTokenRoutes from "./auth/login"
import sessionRoutes from "./state/session"
import editRoutes from "./prescribe/edit"
import signRoutes from "./prescribe/sign"
import sendRoutes from "./prescribe/send"
import searchRoutes from "./tracker/search"
import dispenseRoutes from "./dispense/dispense"

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
  ...prescribeRoutes,
  ...dispenseRoutes,
  ...trackerRoutes
]

export default routes
