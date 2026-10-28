# Afterhours Spotify test build

Adapted from MercuryWorkshop/Scramjet-App revision f6f83cbc93091e47b9c357eb00ea289828aedf94, under AGPL-3.0. Original license, source and credits retained. Changes made October 2026: Afterhours interface, persistent service frames, encrypted-media iframe permission, server destination restrictions, origin checks, connection caps, health endpoint and Render configuration support. Source: https://github.com/hiii121hub/afterhours-spotify.

Install: `npm ci --ignore-scripts`. Run locally: `PORT=4210 npm start`. Public hosting: set `HOST=0.0.0.0`; Render supplies `PORT` and `RENDER_EXTERNAL_URL`. This is a Node HTTP/WebSocket service, not a static site. No secrets or client ID required by this wrapper.

Spotify loads through Scramjet and a Wisp transport restricted to Spotify and named web dependencies on port 443. Direct IP targets and private/loopback DNS results are blocked. Only same-origin WebSocket upgrades on /wisp/ are accepted. Global and per-connection caps limit resource usage; this is not a capacity guarantee. No request, credential or cookie logging is enabled. Browser-side proxy state is per browser profile; visitors sharing a device should sign out after use. The wrapper operator controls code running on this origin; it is a test build, not an official Spotify application.

Spotify accounts, ads, DRM, subscription and browser restrictions still apply. This does not provide anonymous playback or shared account access. The Spotify full catalog and own free-account sign-in prompt were observed locally; account sign-in and audio playback are unverified. An embedded iframe rendering Spotify is not proof that DRM playback works. Third-party sign-in providers and mobile media support may fail. Do not advertise full playback until tested with a consenting user's account in a supported browser.

The existing Crunchyroll show/trailer section is retained pending clarification, and is unrelated to the Spotify transport. Games are deferred at the user's request. Upstream source is in README.md and LICENSE; the UI provides Source and Credits links.
