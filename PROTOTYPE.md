# Afterhours Spotify test build

Adapted from MercuryWorkshop/Scramjet-App revision f6f83cbc93091e47b9c357eb00ea289828aedf94, under AGPL-3.0. Original license, source and credits retained. Changes made October 2026: Afterhours interface, persistent service frames, encrypted-media iframe permission, server destination restrictions, origin checks, connection caps, health endpoint and Render configuration support. Source: https://github.com/hiii121hub/afterhours-spotify.

Install: `npm ci --ignore-scripts`. Run locally: `PORT=4210 npm start`. Public hosting: set `HOST=0.0.0.0`; Render supplies `PORT` and `RENDER_EXTERNAL_URL`. This is a Node HTTP/WebSocket service, not a static site. No secrets or client ID required by this wrapper.

Spotify loads through Scramjet and a Wisp transport restricted to Spotify and named web dependencies on port 443. Direct IP targets and private/loopback DNS results are blocked. Only same-origin WebSocket upgrades on /wisp/ are accepted. Global socket and per-connection stream caps limit resource usage; this is not a capacity guarantee. No request, credential or cookie logging is enabled. Browser-side proxy state is per browser profile; visitors sharing a device should sign out after use. The wrapper operator controls code running on this origin; it is a test build, not an official Spotify application.

Spotify accounts, ads, DRM, subscription and browser restrictions still apply. This does not provide anonymous playback or shared account access. The Spotify full catalog and own free-account sign-in prompt were observed locally; account sign-in and audio playback are unverified. An embedded iframe rendering Spotify is not proof that DRM playback works. Third-party sign-in providers and mobile media support may fail. Do not advertise full playback until tested with a consenting user's account in a supported browser.

The Videos section uses an official Crunchyroll trailer embed. Games use a separate game origin and stay in the player window.

Public test deployment: https://afterhours-spotify.onrender.com. Render free web service, Node 22, npm ci --ignore-scripts, npm start. A free service can sleep when idle and has capacity and bandwidth limits; no unlimited availability is promised. Tests include hostname/IP filtering and actual HTTP/WebSocket rejection of foreign origins and forbidden targets.

## Games and videos update

Seven GN entries are integrated under the user's stated authorization. See reports/GAMES.md and reports/game-audit.json for exact source mappings and gameplay/mobile limitations. The game host serves public/game-builds without Node dependencies; the main server rejects /game-builds/* so game scripts do not share Spotify storage.
Videos now use a local page with an official Crunchyroll YouTube trailer embed. Removed external episode/search/show links and YouTube fallback links. Child frames omit popup/top-navigation sandbox permissions; provider UI remains intact. Video uses a credentialless iframe to coexist with the Spotify proxy's cross-origin isolation. Local browser test observed the trailer reach 56 seconds and enter/exit fullscreen. Full Crunchyroll episodes are not offered. Spotify authentication 403 remains unresolved; no account/playback success is claimed.

## Spotify frame failure repair

Reproduced the browser error in the Spotify iframe after the shared sandbox was added. Scramjet 1.1 adds Cross-Origin-Opener-Policy to proxied responses when the outer app is isolated. In sandboxed iframe navigations this caused a browser network error. The service worker now omits only that generated opener header from iframe responses, retaining the outer app's COOP, the child response's COEP, the iframe sandbox, encrypted-media permission and transport destination/origin restrictions. Without a controlling service worker, direct proxy URLs return to the site wrapper so the transport initializes. Visitors should use the site homepage rather than an internal proxy URL. Registration avoids cached worker imports.

Local browser checks with the sandbox retained: catalog loaded, Daft Punk search returned real tracks, Play One More Time produced Spotify's own free-account sign-in prompt, and its email sign-in page loaded inside the frame. Seven Node tests cover the transport and worker behavior. This fixes loading; authenticated sign-in, full-song audio, and third-party Google/Apple authentication are NOT verified. Google sign-in's prior 403 has not been represented as fixed. The Spotiamp reference requires Premium and a developer client ID and does not meet the user's free-account requirement; it was not copied.


## Email sign-in and game repairs

The header opens Spotify's email sign-in inside the existing player. Google rejects embedded/proxied authentication and has not been bypassed. A Google-created Spotify account can use Spotify's supported email/password flow after the account owner sets a Spotify password. No account credentials are included in this project. Full authenticated playback still requires a consenting signed-in user and remains unverified.

Game wrappers restore real provider SDKs, preserve ad callbacks, repair actual asset loading and player rendering, and add on-screen controls for keyboard-only local builds. Ice Dodo uses the current official creator embed. Main COOP/COEP and transport access restrictions remain enabled. Seven Node checks and ESLint pass. Browser test scope and external dependencies are recorded in reports/GAMES.md.


## Interface cleanup and login limitations — October 28

Removed the Videos UI and files, Credits page/button, site branding and game test badges/report links from the public interface. Source/license notices remain in the source distribution. Spotify reload now rebuilds the wrapper/transport connection after a deploy or suspended tab, initialization failures can retry, and startup waits until a service worker actually controls the page.

A fresh live tab loads the Spotify catalog. The user's email login attempt returned Spotify's own error after submission; all provider buttons were reported failing. Google explicitly rejects OAuth through an embedded proxy. These changes do not claim to fix provider authentication or full-song playback. A supported embedded preview player or normal-browser Spotify flow requires a user choice; no security checks are bypassed.


## Games blank-screen repair

Games now open at /games on the same site, outside the Spotify wrapper. That trusted catalog route retains COOP and nosniff but does not request Spotify's COEP/SAB environment. Games continue to execute only in sandboxed iframes on the separate game host; /game-builds/* remains denied on the account origin. The Spotify route and transport keep their original isolation and destination checks. This avoids relying on experimental credentialless iframe support for Games.

Spotify scripts and SharedWorker construction are deferred until Spotify is requested. A regression check opens Games with both dependencies missing. Nine checks and ESLint pass. Public entry URLs for all seven games return 200; OvO, OvO 2, Gladihoppers and Stickman Hook reached menus/tutorials in the live site during this investigation. Poki's SDK reported an unapproved-domain warning for Gladihoppers despite displaying the tutorial; no SDK checks or ads were bypassed.
