import statusRoutes from "./health/get-status"

const healthcheckRoutes = [
  ...statusRoutes
]

const routes = [
  ...healthcheckRoutes
]

export default routes
