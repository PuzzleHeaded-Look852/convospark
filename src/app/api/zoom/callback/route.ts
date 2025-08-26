import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

  const clientId = process.env.ZOOM_CLIENT_ID
  const clientSecret = process.env.ZOOM_CLIENT_SECRET
  const redirectUri = process.env.ZOOM_REDIRECT_URI
  if (!clientId || !clientSecret || !redirectUri) return NextResponse.json({ error: 'Zoom not configured' }, { status: 500 })

  // Exchange code for tokens
  const tokenRes = await fetch('https://zoom.us/oauth/token?grant_type=authorization_code&code=' + encodeURIComponent(code) + '&redirect_uri=' + encodeURIComponent(redirectUri), {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    }
  })

  const tokenJson = await tokenRes.json()
  // TODO: persist tokens keyed by user/account

  // Redirect back to client, preserve state
  let redirect = '/'
  try {
    if (state) {
      const parsed = JSON.parse(decodeURIComponent(state))
      if (parsed && parsed.redirect) redirect = parsed.redirect
    }
  } catch {
    // ignore malformed state
  }

  const redirectUrl = new URL(redirect, process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000')
  // append token info as a fragment for client-side pickup (optional)
  redirectUrl.hash = `zoom_token=${encodeURIComponent(JSON.stringify(tokenJson))}`

  return NextResponse.redirect(redirectUrl.toString())
}
