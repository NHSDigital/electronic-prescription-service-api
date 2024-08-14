export function redirect(url: string): void {
  // eslint-disable-next-line no-undef
  window.location.assign(url)
}

export interface Redirect {
  redirectUri: string
}

export function isRedirect(data: unknown): data is Redirect {
  return (data as Redirect).redirectUri !== undefined
}
