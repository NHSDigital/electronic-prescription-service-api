export async function makeRequest(method: string, url: string, body?: unknown): Promise<any> {
  const uri = encodeURI(url)
  
  const response = await fetch(uri, {
    method: method,
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    },
    redirect: 'manual',
    referrerPolicy: 'no-referrer',
    body: body as any
  })

  if (response.status === 302) {
    var location = this.getResponseHeader("Location")
    window.location.href = location
  }

  if (response.status === 429) {
    throw new Error("Recieved 'Too Many Requests' response when attempting to fetch data")
  }

  return await response.json()
}
