export type Fetcher = typeof fetch
export type FetchRequester = (request: Request) => Promise<Response>
export type FetchMiddleware = (next: FetchRequester) => FetchRequester

/**
 * Creates a fetch-compatible function that applies middleware to the request and response.
 *
 * @param {Fetcher} fetch - The fetch function to be used for making requests.
 * @param {FetchMiddleware[]} middlewares - An array of middleware functions to be chained in order.
 * @returns {Fetcher} A fetch-compatible function with middleware applied.
 *
 * Example:
 *
 * function createAuthMiddleware(authProvider) {
 *   return (next) => async (request) => {
 *     const token = await authProvider.getToken()
 *
 *     // add an Authorization header to the request if available
 *     // otherwise, return a 401 Unauthorized response if the request requires authentication
 *     if (token != null) {
 *       request.headers.set('Authorization', `Bearer ${token}`)
 *     } else if (authProvider.requiresAuthentication(request.url)) {
 *       return new Response('Unauthorized', { status: 401 })
 *     }
 *
 *     const response = await next(request)
 *
 *     // ..and also add an identity to the response
 *     response.identity = token
 *     return response
 *   }
 * }
 *
 *
 * const fetchWithMiddleware = createFetcher(fetch, [createAuthMiddleware(authProvider)])
 * fetchWithMiddleware('https://api.example.com/secure/data')
 */
export function createFetcher(
  fetch: Fetcher,
  middlewares: FetchMiddleware[],
): Fetcher {
  return async (...args) => {
    const copy = [...middlewares]

    const next: FetchRequester = async (req) => {
      const middleware = copy.shift()
      if (middleware == null) {
        return await fetch(req)
      }
      else {
        return await middleware(next)(req)
      }
    }

    return await next(new Request(...args))
  }
}
