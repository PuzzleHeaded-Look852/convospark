import { NextResponse } from 'next/server'

// Start Zoom OAuth flow by redirecting to Zoom's authorize URL
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams
  const redirect = params.get('redirect') || '/'

  const clientId = process.env.ZOOM_CLIENT_ID
  const redirectUri = process.env.ZOOM_REDIRECT_URI
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: 'Zoom client not configured' }, { status: 500 })
  }

  const state = encodeURIComponent(JSON.stringify({ redirect }))
  const authUrl = new URL('https://zoom.us/oauth/authorize')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('state', state)

  return NextResponse.redirect(authUrl.toString())
}
