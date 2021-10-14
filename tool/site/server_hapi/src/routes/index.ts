import statusRoutes from "./health/get-status"
import editRoutes from "./prescribe/edit"
import signRoutes from "./prescribe/sign"
import sendRoutes from "./prescribe/send"

const prescribeRoutes = [
  ...editRoutes,
  ...signRoutes,
  ...sendRoutes
]

const healthcheckRoutes = [
  ...statusRoutes
]

const routes = [
  ...healthcheckRoutes,
  ...prescribeRoutes
]

export default routes
