import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

test("Games opens without Spotify scripts or a working SharedWorker", async () => {
	const makeElement = () => ({
		hidden: false,
		classList: { toggle() {} },
		setAttribute() {},
		append() {},
		textContent: "",
	});
	const elements = new Map(
		[
			"#spotify-login",
			"#service-note",
			"#stage",
			".start",
			"#status",
			"#start",
			"#reload",
		].map((name) => [name, makeElement()])
	);
	const buttons = ["spotify", "games"].map((service) => ({
		...makeElement(),
		dataset: { service },
	}));
	let destination;
	const document = {
		querySelector: (name) => elements.get(name),
		querySelectorAll: () => buttons,
		createElement: (tag) => {
			assert.equal(tag, "iframe", "Games must not load the Spotify scripts");
			throw Error("Games must navigate independently of the Spotify frame");
		},
		head: {
			append() {
				throw Error("Spotify script loaded while opening Games");
			},
		},
	};
	const context = {
		document,
		window: {},
		URLSearchParams,
		location: {
			search: "",
			protocol: "https:",
			host: "example.test",
			assign: (value) => {
				destination = value;
			},
		},
	};
	runInNewContext(
		await readFile(new URL("../public/index.js", import.meta.url), "utf8"),
		context
	);
	await buttons[1].onclick();
	assert.equal(destination, "/games");
});
