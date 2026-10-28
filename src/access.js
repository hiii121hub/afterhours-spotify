import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

// Spotify plus the web player's consent, advertising, analytics and CAPTCHA dependencies.
const domains = [
	"spotify.com",
	"spotify.net",
	"spotifycdn.com",
	"spotifycdn.net",
	"scdn.co",
	"spotifycdn.map.fastly.net",
	"audio-ak-spotify-com.akamaized.net",
	"google.com",
	"gstatic.com",
	"google-analytics.com",
	"googletagmanager.com",
	"googleadservices.com",
	"googlesyndication.com",
	"doubleclick.net",
	"ads-twitter.com",
	"analytics.twitter.com",
	"pinimg.com",
	"sc-static.net",
	"ravenjs.com",
	"connect.facebook.net",
	"scorecardresearch.com",
	"cookielaw.org",
	"onetrust.com",
	"fastly-insights.com",
	"hotjar.com",
	"analytics.tiktok.com",
	"redditstatic.com",
	"contentsquare.net",
	"get.microsoft.com",
	"heap-api.com",
	"heapanalytics.com",
	"publicsuffix.org",
];
export const allowedHosts = domains.map(
	(domain) =>
		new RegExp("^(?:[a-z0-9-]+\\.)*" + domain.replaceAll(".", "\\.") + "$", "i")
);
export function isAllowedHost(host) {
	return (
		typeof host === "string" &&
		allowedHosts.some((pattern) => pattern.test(host))
	);
}
export function isPublicIPv4(address) {
	if (isIP(address) !== 4) return false;
	const [a, b, c] = address.split(".").map(Number);
	return !(
		a === 0 ||
		a === 10 ||
		a === 127 ||
		a >= 224 ||
		(a === 100 && b >= 64 && b <= 127) ||
		(a === 169 && b === 254) ||
		(a === 172 && b >= 16 && b <= 31) ||
		(a === 192 && (b === 168 || b === 0 || b === 2)) ||
		(a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
		(a === 203 && b === 0 && c === 113)
	);
}
export async function resolveDestination(host) {
	if (!isAllowedHost(host)) throw new Error("Destination unavailable");
	const { address } = await lookup(host, { family: 4 });
	if (!isPublicIPv4(address)) throw new Error("Destination unavailable");
	return address;
}
export function isAllowedUpgrade(req, publicOrigin) {
	if (req.url !== "/wisp/" || !req.headers.origin) return false;
	try {
		return new URL(req.headers.origin).origin === publicOrigin;
	} catch {
		return false;
	}
}
