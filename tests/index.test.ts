import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { createFetcher, type Fetcher, type FetchMiddleware } from '../src/index.ts'

test('createFetcher applies a single middleware correctly', async () => {
  const mockFetch: Fetcher = async () => await Promise.resolve(new Response('mock response', { status: 200 }))

  const middleware: FetchMiddleware = next => async (req) => {
    const res = await next(req)
    res.headers.set('X-Response-Header', 'middleware')
    return res
  }

  const fetchWithMiddleware = createFetcher(mockFetch, [middleware])
  const response = await fetchWithMiddleware('https://example.com')

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('X-Response-Header'), 'middleware')
})

test('createFetcher works without middlewares', async () => {
  const mockFetch: Fetcher = async () => new Response('mock response', { status: 200 })
  const fetchWithoutMiddleware = createFetcher(mockFetch, [])
  const response = await fetchWithoutMiddleware('https://example.com')

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('X-Response-Header'), null)
})

test('createFetcher does not mutate the input middleware array', async () => {
  const mockFetch: Fetcher = async () => new Response('mock response', { status: 200 })
  const middlewareA: FetchMiddleware = next => async req => await next(req)
  const middlewareB: FetchMiddleware = next => async req => await next(req)

  const middlewares = [middlewareA, middlewareB]
  const originalMiddlewares = [...middlewares]

  const fetchWithMiddleware = createFetcher(mockFetch, middlewares)
  await fetchWithMiddleware('https://example.com')

  assert.deepEqual(middlewares, originalMiddlewares)
})

test('createFetcher calls multiple middlewares in bubble-up style', async () => {
  const callOrder: string[] = []
  const mockFetch: Fetcher = async () => new Response('final response', { status: 200 })

  const middlewareA: FetchMiddleware = next => async (req) => {
    callOrder.push('A before next')
    req.headers.set('X-From-A', 'true')
    const res = await next(req)
    callOrder.push('A after next')
    res.headers.set('X-Flow', (res.headers.get('X-Flow') ?? '') + 'A')
    return res
  }

  const middlewareB: FetchMiddleware = next => async (req) => {
    callOrder.push('B before next')
    assert.equal(req.headers.get('X-From-A'), 'true')
    const res = await next(req)
    callOrder.push('B after next')
    res.headers.set('X-Flow', (res.headers.get('X-Flow') ?? '') + 'B')
    return res
  }

  const fetchWithMiddleware = createFetcher(mockFetch, [middlewareA, middlewareB])
  const response = await fetchWithMiddleware('https://example.com')

  assert.deepEqual(callOrder, [
    'A before next',
    'B before next',
    'B after next',
    'A after next',
  ])
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('X-Flow'), 'BA')
})

test('middleware can short-circuit', async () => {
  const mockFetch: Fetcher = async () => new Response('Should not reach here', { status: 200 })

  const authMiddleware: FetchMiddleware = () => async () => new Response('Unauthorized', { status: 401 })

  const secondMiddleware: FetchMiddleware = next => async (req) => {
    const res = await next(req)
    res.headers.set('X-Extra', 'SecondMiddleware')
    return res
  }

  const fetchWithMiddleware = createFetcher(mockFetch, [authMiddleware, secondMiddleware])
  const response = await fetchWithMiddleware('https://example.com')

  assert.equal(response.status, 401)
  assert.equal(await response.text(), 'Unauthorized')
  assert.equal(response.headers.get('X-Extra'), null)
})

test('short-circuited middleware => fetch not called', async (t) => {
  const fetchSpy = t.mock.fn<Fetcher>(
    async () => new Response('Should not reach here', { status: 200 }),
  )

  const shortCircuitMiddleware: FetchMiddleware = () => async () => new Response('Nope', { status: 403 })

  const fetchWithMiddleware = createFetcher(fetchSpy, [shortCircuitMiddleware])
  const response = await fetchWithMiddleware('https://example.com')

  assert.equal(response.status, 403)
  assert.equal(await response.text(), 'Nope')
  assert.equal(fetchSpy.mock.calls.length, 0)
})
