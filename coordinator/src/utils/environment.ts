const environment = process.env.ENVIRONMENT

export const isInternalDev = (): boolean => environment === "internal-dev"
export const isProd = (): boolean => environment === "prod"
export const isLocal = (): boolean => environment === "local"
