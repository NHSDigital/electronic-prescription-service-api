const environment = process.env.ENVIRONMENT

export const isProd = environment === "prod"
export const isLocal = environment === "local"