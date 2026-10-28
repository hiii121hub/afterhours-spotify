# Game integration and tests — October 28, 2026

The user states permission to use these games and covers. GN repository availability alone does not establish a license; that earlier repository check is retained in the conversation. This update proceeds under the user's authorization. Game copyrights remain with their creators; the wrapper's AGPL does not relicense game content.

The catalog IDs, original GN loaders, hashes, dependencies, covers and test results are mapped in game-audit.json. Actual execution is isolated on a separate game host. The primary site denies its own /game-builds/* routes, preserves its Spotify isolation policies, and embeds the game host without popup or top-navigation permissions.

| Game | Source / integration | Gameplay checked |
|---|---|---|
| OvO (1) | Original index from Replku/Ovo, pinned 2b17271c24535b96a49c4d1b9f64cd998aa2d060; original CDN assets | Level 1 completed, level 2 entered; movement/jump; phone controls |
| OvO 2 (2) | ov464534asa4rb/786132, pinned 51d21da0643e5b846f5636ae910bb2b7cb6a9967 | Tutorial movement/jump; fixed player sorted behind backdrop; phone controls |
| OvO 3 Dimensions (3) | bubblfan/ovo-3-dimension, pinned 102179bf4242fd237c46c555ba154c2f325d351c | First level CLEAR; movement/jump; phone controls |
| Gladihoppers (4) | GN-linked bubbls/UGS-Assets build; local Unity data/code, official Poki SDK | Movement/stance tutorial, dummy hit counter; phone movement |
| Ice Dodo (5) | Current official https://icedodo.io iframe | Welcome Map runs, steering, death/restart inside frame |
| Sprunki (9) | bubblfan/sprunki, pinned 7ff2329186eb8b8c80d16826cd319e3c7d2cf776 | Dragged sound icons onto two characters at desktop/phone widths |
| Stickman Hook (11) | taskmaster773/google-class, pinned cd06df26d3c4d9f73c8151fc13f7b2dc27f3adda | Level 1 completed; actual provider ad completed; level 2 started; phone hold/release |

Repairs retain actual provider SDK initialization and ad/reward results. Mirrored Poki replacement SDKs, fake ad success, origin spoofing, fetch interception and console suppression are not used. Gladihoppers' undefined document.xURL was repaired to the actual document.URL. No publisher domain checks were disabled. The old Ice Dodo mirror was incomplete and is replaced by the creator-hosted game; its unavailable maps and ad bootstrap were not faked.

Fullscreen uses the site's player shell. Closing a game removes its iframe; restart remounts it. Popups and top-level navigation are not permitted. External service links may still appear within provider UI, and provider availability may change.

Test scope: desktop gameplay on the same standalone builds, embedded loading and fullscreen, and a 390×844 phone viewport with pointer input. Nested cross-origin canvas pointer automation was unavailable in this browser for some builds, so standalone gameplay was tested separately from embedding. Physical touchscreen input and audible sound were not verified. Ice Dodo needs keyboard steering in this test. Gladihoppers is best in landscape. Stickman Hook's provider account banner can exceed phone width. These are smoke tests of real gameplay, not completion of every map or level.

External dependencies: OvO's pinned jsDelivr assets; official Poki SDK/ads for OvO 3, Gladihoppers and Stickman Hook; Ice Dodo's creator site/APIs. Other mirrored runtime/assets are served from the game host. Each provider remains responsible for its availability, ads and account requirements.
