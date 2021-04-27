import convertPrescriptionRoutes from "./debug/convert"
import validatorRoutes from "./debug/validate"
import preparePrescriptionRoutes from "./prescribe/prepare"
import processPrescriptionRoutes from "./process"
import statusRoutes from "./health/get-status"
import pollingRoutes from "./prescribe/polling"
import releaseRoutes from "./dispense/release"
import taskRoutes from "./dispense/task"
import {isProd} from "../services/environments/environment"

const debugRoutes = [
  ...convertPrescriptionRoutes,
  ...validatorRoutes
]

const mainRoutes = [
  ...preparePrescriptionRoutes,
  ...processPrescriptionRoutes,
  ...releaseRoutes,
  ...statusRoutes,
  ...pollingRoutes,
  ...taskRoutes
]

const routes = [
  ...mainRoutes
]

if (!isProd) {
  routes.push(...debugRoutes)
}

export default routes