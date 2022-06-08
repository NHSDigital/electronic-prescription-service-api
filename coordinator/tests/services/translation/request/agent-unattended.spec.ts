import {odsClient} from "../../../../src/services/communication/ods-client"
import pino from "pino"
import {fhir, processingErrors as errors} from "@models"
import {toArray} from "../../../../src/services/translation/common"
import {
  DEFAULT_ROLE_CODE,
  DEFAULT_RPID,
  DEFAULT_USER_NAME,
  DEFAULT_UUID
} from "../../../../src/utils/headers"
