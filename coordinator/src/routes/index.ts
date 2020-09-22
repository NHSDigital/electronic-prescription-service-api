import convertPrescriptionRoutes from "./prescription/post-convert-full-message"
import preparePrescriptionRoutes from "./prescription/post-prepare-message"
import sendPrescriptionRoutes from "./prescription/post-process-message"
import statusRoutes from "./health/get-status"
import pollingRoutes from "./prescription/polling"

export default [
  ...convertPrescriptionRoutes,
  ...preparePrescriptionRoutes,
  ...sendPrescriptionRoutes,
  ...statusRoutes,
  ...pollingRoutes
]
