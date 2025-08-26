ConvoSpark Teams package

Files in this folder:
- manifest.json  -> Edit `contentUrl` and `validDomains` to your deployed hostname before packaging
- outline.png    -> 32x32 outline icon placeholder
- color.png      -> 192x192 color icon placeholder
 - outline.svg    -> 32x32 outline SVG icon placeholder
 - color.svg      -> 192x192 color SVG icon placeholder

How to package and upload:
1. Update `manifest.json` fields: `websiteUrl`, `contentUrl`, and `validDomains` to your public URL.
2. Zip the manifest and the two icons (icons must be in the root of the zip alongside manifest.json):

   cd teams
   zip convospark-teams-app.zip manifest.json outline.svg color.svg

3. In Microsoft Teams Developer Portal (or App Studio), upload the zip as a custom app.

Notes:
- Replace the placeholder UUID in the manifest only if you want a new id; Teams accepts any valid UUID.
- For tabs that require auth or SSO, implement Azure AD and add redirect URLs.

Zoom integration note:
- This project includes a Zoom scaffold under `src/app/api/zoom` with OAuth start (`/api/zoom/oauth`), callback (`/api/zoom/callback`) and webhook (`/api/zoom/webhook`).
- Update `manifest.json` `contentUrl` and app URLs before publishing the Teams package. If you plan to use Zoom alongside Teams, ensure your deploy has the appropriate public redirect URLs.
