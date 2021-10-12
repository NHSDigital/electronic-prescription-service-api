import {pageData} from "../ui/state"

export function makeRequest(method: string, url: string, body?: unknown): any {
  const uri = encodeURI(url)
  const xhr = new XMLHttpRequest()
  try {
    xhr.withCredentials = true
    xhr.open(method, uri, false)
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
    xhr.send(body as any)
  } catch {
    // if we get an undetectable cors error caused by oauth triggering on a post,
    // then logout to prompt a new login session
    window.location.href = `${pageData.baseUrl}logout`
  }
  return JSON.parse(xhr.responseText)
}
