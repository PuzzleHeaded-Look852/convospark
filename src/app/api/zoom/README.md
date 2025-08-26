Zoom integration (scaffold)

This folder contains a minimal scaffold for Zoom OAuth and webhook handling.

Files:
- `oauth/route.ts` — redirects users to Zoom's OAuth authorize endpoint.
- `callback/route.ts` — receives authorization code and exchanges for tokens (TODO: persist tokens).
- `webhook/route.ts` — receives Zoom webhooks (verify signatures in production).

Notes:
- Set these environment variables in your deployment or local `.env`:
  - ZOOM_CLIENT_ID
  - ZOOM_CLIENT_SECRET
  - ZOOM_REDIRECT_URI (must match Zoom App settings)

- For production, verify webhook signatures and persist tokens securely (database or secrets store).
