export async function makeRequest(method: string, url: string, body?: unknown): Promise<any> {
  const uri = encodeURI(url)
  
  const response = await fetch(url, {
    method: body ? 'POST' : 'GET',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    },
    redirect: 'manual',
    referrerPolicy: 'no-referrer',
    body: body as string
  })

  if (response.status === 302) {
    var location = this.getResponseHeader("Location")
    window.location.href = location
  }

  return JSON.parse(await response.json())
}
