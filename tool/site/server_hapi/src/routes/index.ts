import statusRoutes from "./health/get-status"
import editRoutes from "./prescribe/edit"

const prescribeRoutes = [
  ...editRoutes
]

const healthcheckRoutes = [
  ...statusRoutes
]

const routes = [
  ...healthcheckRoutes,
  ...prescribeRoutes
]

export default routes
