import convertPrescriptionRoutes from "./debug/convert"
import validatorRoutes from "./debug/validate"
import doseToTextRoutes from "./debug/dose-to-text"
import preparePrescriptionRoutes from "./prescribe/prepare"
import processPrescriptionRoutes from "./process"
import statusRoutes from "./health/get-status"
import metadataRoutes from "./metadata"
import pollingRoutes from "./polling"
import releaseRoutes from "./dispense/release"
import taskRoutes from "./dispense/task"
import claimRoutes from "./dispense/claim"
import {taskTrackerRoutes, prescriptionTrackerRoutes} from "./tracker"
import verifySignatureRoutes from "./dispense/verify-signature"
import {isProd} from "../utils/environment"

const ptlRoutes = [
  ...convertPrescriptionRoutes,
  ...validatorRoutes,
  ...doseToTextRoutes,
  ...prescriptionTrackerRoutes
]

const mainRoutes = [
  ...preparePrescriptionRoutes,
  ...processPrescriptionRoutes,
  ...releaseRoutes,
  ...pollingRoutes,
  ...taskRoutes,
  ...claimRoutes,
  ...taskTrackerRoutes,
  ...verifySignatureRoutes,
  ...metadataRoutes
]

const healthcheckRoutes = [
  ...statusRoutes
]

const routes = [
  ...healthcheckRoutes,
  ...mainRoutes
]

if (!isProd()) {
  routes.push(...ptlRoutes)
}

export default routes
