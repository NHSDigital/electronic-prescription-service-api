import {ServerRoute} from "@hapi/hapi"
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
import {taskTrackerRoutes} from "./tracker"
import {isProd} from "../utils/environment"

const ptlRoutes: Array<ServerRoute> = [
  ...convertPrescriptionRoutes,
  ...validatorRoutes,
  ...doseToTextRoutes
]

const mainRoutes: Array<ServerRoute> = [
  ...preparePrescriptionRoutes,
  ...processPrescriptionRoutes,
  ...releaseRoutes,
  ...pollingRoutes,
  ...taskRoutes,
  ...claimRoutes,
  ...taskTrackerRoutes,
  ...metadataRoutes
]

const healthcheckRoutes: Array<ServerRoute> = [
  ...statusRoutes
]

const routes: Array<ServerRoute> = [
  ...healthcheckRoutes,
  ...mainRoutes
]

if (!isProd()) {
  routes.push(...ptlRoutes)
}

export default routes
