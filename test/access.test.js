import test from "node:test";
import assert from "node:assert/strict";
import {
	isAllowedHost,
	isPublicIPv4,
	isAllowedUpgrade,
} from "../src/access.js";
test("transport only permits Spotify and named dependencies", () => {
	for (const host of [
		"open.spotify.com",
		"accounts.spotify.com",
		"audio-fa.scdn.co",
		"www.google.com",
		"CDN.COOKIELAW.ORG",
	])
		assert.equal(isAllowedHost(host), true, host);
	for (const host of [
		"example.com",
		"spotify.com.attacker.test",
		"evilspotify.com",
		"localhost",
		"127.0.0.1",
		"spotify.com/evil",
		"open.spotify.com\n",
	])
		assert.equal(isAllowedHost(host), false, host);
});
test("resolved destinations must be public IPv4 addresses", () => {
	for (const address of [
		"127.0.0.1",
		"10.2.3.4",
		"169.254.169.254",
		"172.16.0.1",
		"172.31.0.1",
		"192.168.1.2",
		"100.64.0.1",
		"198.18.0.1",
		"0.0.0.0",
		"224.0.0.1",
		"::1",
		"::ffff:127.0.0.1",
		"not-an-ip",
	])
		assert.equal(isPublicIPv4(address), false, address);
	for (const address of ["8.8.8.8", "1.1.1.1", "104.154.127.126"])
		assert.equal(isPublicIPv4(address), true, address);
});
test("WebSocket upgrades require the exact route and site origin", () => {
	const req = {
		url: "/wisp/",
		headers: { origin: "https://afterhours.example" },
	};
	assert.equal(isAllowedUpgrade(req, "https://afterhours.example"), true);
	for (const origin of [
		undefined,
		"null",
		"https://other.example",
		"https://afterhours.example.attacker.test",
	])
		assert.equal(
			isAllowedUpgrade(
				{ ...req, headers: { origin } },
				"https://afterhours.example"
			),
			false
		);
	assert.equal(
		isAllowedUpgrade(
			{ ...req, url: "/wisp/other/" },
			"https://afterhours.example"
		),
		false
	);
});
