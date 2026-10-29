import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

test("player startup waits for service-worker control on a first visit", async () => {
	const listeners = new Map();
	const worker = {
		controller: null,
		ready: Promise.resolve(),
		register: async () => ({}),
		addEventListener: (name, callback) => listeners.set(name, callback),
		removeEventListener: (name) => listeners.delete(name),
	};
	const register = runInNewContext(
		(await readFile(
			new URL("../public/register-sw.js", import.meta.url),
			"utf8"
		)) + ";registerSW",
		{
			navigator: { serviceWorker: worker },
			location: { protocol: "https:", hostname: "player.example" },
			setTimeout,
			clearTimeout,
		}
	);
	let completed = false;
	const pending = register().then(() => {
		completed = true;
	});
	await new Promise((resolve) => setImmediate(resolve));
	assert.equal(completed, false);
	worker.controller = {};
	listeners.get("controllerchange")();
	await pending;
	assert.equal(completed, true);
	assert.equal(listeners.size, 0);
});
