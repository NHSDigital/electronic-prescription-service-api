const environment = process.env.ENVIRONMENT

export const isProd = (): boolean => environment === "prod"
export const isLocal = (): boolean => environment === "local"
