import convertPrescriptionRoutes from "./debug/convert"
import validatorRoutes from "./debug/validate"
import preparePrescriptionRoutes from "./prescribe/prepare"
import processPrescriptionRoutes from "./process"
import statusRoutes from "./health/get-status"
import pollingRoutes from "./prescribe/polling"
import releaseRoutes from "./dispense/release"
import taskRoutes from "./dispense/task"
import trackerPrescriptionByIdRoutes from "./tracker/get-prescription"
import trackerPrescriptionsByOdsRoutes from "./tracker/get-prescriptions-by-ods-code"
import {isProd} from "../services/environment"

const debugRoutes = [
  ...convertPrescriptionRoutes,
  ...validatorRoutes
]

const mainRoutes = [
  ...preparePrescriptionRoutes,
  ...processPrescriptionRoutes,
  ...releaseRoutes,
  ...pollingRoutes,
  ...taskRoutes,
  ...trackerPrescriptionByIdRoutes,
  ...trackerPrescriptionsByOdsRoutes

]

const healthcheckRoutes = [
  ...statusRoutes
]

const routes = [
  ...healthcheckRoutes,
  ...mainRoutes
]

if (!isProd()) {
  routes.push(...debugRoutes)
}

export default routes
