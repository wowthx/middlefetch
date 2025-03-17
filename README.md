# Middlefetch

Super simple, zero dependency middleware for fetch.

## Installation

```sh
npm install @wowthx/middlefetch
```

## Usage

Here's a quick example of how to use Middlefetch with an authentication middleware:

```ts
import { createFetcher } from '@wowthx/middlefetch';

function createAuthMiddleware(authProvider) {
  return (next) => async (request) => {
    const token = await authProvider.getToken()
    if (token != null) {
      request.headers.set('Authorization', `Bearer ${token}`)
    } else if (authProvider.requiresAuthentication(request.url)) {
      return new Response('Unauthorized', { status: 401 })
    }
    
    const response = await next(request)
    return response
  }
}

const fetchWithMiddleware = createFetcher(fetch, [createAuthMiddleware(authProvider)])
fetchWithMiddleware('https://api.example.com/secure/data')
```

## Or just drop the code in your project

```ts
export type Fetcher = typeof fetch;
export type FetchRequester = (request: Request) => Promise<Response>;
export type FetchMiddleware = (next: FetchRequester) => FetchRequester;

export function createFetcher(fetch: Fetcher, middlewares: FetchMiddleware[]): Fetcher {
  return async (...args) => {
    const copy = [...middlewares];

    const next: FetchRequester = async (req) => {
      const middleware = copy.shift();
      if (middleware == null) {
        return await fetch(req);
      } else {
        return await middleware(next)(req);
      }
    };

    return await next(new Request(...args));
  };
}
```
