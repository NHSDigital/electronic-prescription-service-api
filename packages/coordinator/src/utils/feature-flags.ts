import pino from "pino"

export function getPrescribeEnabled(): boolean {
  return process.env.PRESCRIBE_ENABLED === "true"
}

export function getDispenseEnabled(): boolean {
  return process.env.DISPENSE_ENABLED === "true"
}

export function getSHA256PrepareEnabled(applicationId: string): boolean {
  let sha1Ids = process.env.SHA1_ENABLED_APPLICATION_IDS?.split(",") ?? []
  return !sha1Ids.includes(applicationId)
}

export function getDoseToTextMode(logger: pino.Logger): DoseToTextMode {
  const mode = process.env.DOSE_TO_TEXT_MODE
  if (mode in DoseToTextMode) {
    return mode as DoseToTextMode
  }
  if (mode) {
    logger.warn(`Invalid dose to text mode "${mode}". Using "DISABLED".`)
  }
  return DoseToTextMode.DISABLED
}

export function isEpsHostedContainer(): boolean {
  return process.env.MTLS_SPINE_CLIENT === "true"
}

export function enableDefaultAsidPartyKey(): boolean {
  return process.env.ENABLE_DEFAULT_ASID_PARTY_KEY === "true"
}
export function isSandbox(logger?: pino.Logger): boolean {
  const isEnabled = process.env.SANDBOX === "1"
  if (logger) {
    logger.info(`Sandbox mode is ${isEnabled ? "enabled" : "disabled"}`)
  } else {
    const logger = pino() // Create a logger instance
    logger.info(`Sandbox mode is ${isEnabled ? "enabled" : "disabled"}`)
  }
  return isEnabled
}

export enum DoseToTextMode {
  DISABLED = "DISABLED",
  AUDIT = "AUDIT"
}
