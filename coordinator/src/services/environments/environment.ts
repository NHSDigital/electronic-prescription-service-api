export const ENVIRONMENT = process.env.ENVIRONMENT

export const isProd = ENVIRONMENT === "prod"
export const isLocal = ENVIRONMENT === "local"