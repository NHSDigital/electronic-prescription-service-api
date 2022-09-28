const environment = process.env.ENVIRONMENT

export const isProd = (): boolean => environment === "prod"
export const isLocal = (): boolean => environment === "local"
export const isSandbox = (): boolean => process.env.SANDBOX === "1"
