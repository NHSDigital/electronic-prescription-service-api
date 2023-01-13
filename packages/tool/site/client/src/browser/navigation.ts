export function redirect(url: string): void {
  window.location.assign(url)
}

export interface Redirect {
  redirectUri: string
}

export function isRedirect(data: unknown): data is Redirect {
  return (data as Redirect).redirectUri !== undefined
}
