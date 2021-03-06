import convertPrescriptionRoutes from "./prescription/post-convert-message"
import preparePrescriptionRoutes from "./prescription/post-prepare-message"
import processPrescriptionRoutes from "./prescription/post-process-message"
import statusRoutes from "./health/get-status"
import pollingRoutes from "./prescription/polling"

export default [
  ...convertPrescriptionRoutes,
  ...preparePrescriptionRoutes,
  ...processPrescriptionRoutes,
  ...statusRoutes,
  ...pollingRoutes
]
