export class HttpError extends Error {
  readonly status: number

  constructor(source: string, status: number) {
    super(`${source}: ${status}`)
    this.status = status
  }
}

export async function fetchOk(url: string, source: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(url, init)
  if (!response.ok) throw new HttpError(source, response.status)
  return response
}
