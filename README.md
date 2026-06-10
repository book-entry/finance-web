# finance-web

Splitwallet frontend — React 18 + TypeScript + Vite, talking to the Spring Boot stack through `finance-gateway`.

## Scripts

```bash
npm install
npm run dev          # http://localhost:5173, proxies to the gateway
npm run test         # vitest watch
npm run test:run     # vitest one-shot (CI)
npm run typecheck    # tsc --noEmit
npm run build        # production build to dist/
```

## Configuring the gateway URL

The gateway URL is **not** hardcoded — it's read from env files Vite picks up automatically. See [`.env.example`](.env.example) for the full list of variables.

### Dev (recommended): proxy through Vite

`npm run dev` boots a proxy at `http://localhost:5173` that forwards `/authentication/*`, `/account/*`, `/transaction/*`, `/ingestion/*` to `VITE_GATEWAY_URL`. The SPA stays same-origin, so no CORS dance is needed.

To point dev at your deployed server without committing the URL:

```bash
echo 'VITE_GATEWAY_URL=https://api.your-server.com' > .env.development.local
npm run dev
```

`.env.development.local` is gitignored. The committed [`.env.development`](.env.development) keeps `http://localhost:8080` as the default.

### Prod: bake the URL into the build

For a production build there's no Vite proxy. Set `VITE_API_BASE_URL` at build time and axios will use it as its base URL directly. The server must allow CORS for the SPA's origin.

```bash
VITE_API_BASE_URL=https://api.your-server.com npm run build
```

### Optional: silent Firebase token refresh

Set `VITE_FIREBASE_API_KEY=…` (the Web SDK API key for the same Firebase project the gateway validates against) and a 401 from any protected endpoint will trigger a silent refresh-token swap before retrying. Without it, a 401 just clears the session and redirects to `/sign-in`.

## Stack

React 18 · TypeScript · Vite · TanStack Router · TanStack Query · Zustand · Ant Design v5 · Vitest + Testing Library.
