import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

async function request(destination, proxied = true) {
	const listeners = new Map();
	const original = () =>
		new Response("document body", {
			status: 202,
			headers: {
				"Cross-Origin-Opener-Policy": "same-origin",
				"Cross-Origin-Embedder-Policy": "require-corp",
				"X-Test-Header": "retained",
			},
		});
	const context = {
		URL,
		Headers,
		Response,
		fetch: async () => original(),
		importScripts() {},
		$scramjetLoadWorker: () => ({
			ScramjetServiceWorker: class {
				async loadConfig() {}
				route() {
					return proxied;
				}
				async fetch() {
					return original();
				}
			},
		}),
		self: {
			addEventListener(name, fn) {
				listeners.set(name, fn);
			},
			skipWaiting() {},
			clients: { claim() {} },
		},
	};
	runInNewContext(
		await readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
		context
	);
	let result;
	listeners.get("fetch")({
		request: {
			destination,
			url: "https://example.test/scramjet/https%3A%2F%2Fopen.spotify.com%2F",
		},
		respondWith(value) {
			result = value;
		},
	});
	return result;
}
test("sandboxed proxy iframe retains isolation policy without an incompatible opener header", async () => {
	const response = await request("iframe");
	assert.equal(response.headers.get("Cross-Origin-Opener-Policy"), null);
	assert.equal(
		response.headers.get("Cross-Origin-Embedder-Policy"),
		"require-corp"
	);
	assert.equal(response.headers.get("X-Test-Header"), "retained");
	assert.equal(response.status, 202);
	assert.equal(await response.text(), "document body");
});
test("top-level proxy responses keep opener isolation", async () => {
	const response = await request("document");
	assert.equal(
		response.headers.get("Cross-Origin-Opener-Policy"),
		"same-origin"
	);
});

test("normal site pages keep all server security headers", async () => {
	const response = await request("iframe", false);
	assert.equal(
		response.headers.get("Cross-Origin-Opener-Policy"),
		"same-origin"
	);
	assert.equal(
		response.headers.get("Cross-Origin-Embedder-Policy"),
		"require-corp"
	);
});
