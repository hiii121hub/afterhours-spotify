"use strict";
let scramjet, connection;
const playerScripts = new Map();
function loadPlayerScript(src) {
	if (playerScripts.has(src)) return playerScripts.get(src);
	const pending = new Promise((resolve, reject) => {
		const script = document.createElement("script");
		script.src = src;
		script.onload = resolve;
		script.onerror = () => {
			script.remove();
			playerScripts.delete(src);
			reject(
				new Error("The Spotify player files could not load. Please retry.")
			);
		};
		document.head.append(script);
	});
	playerScripts.set(src, pending);
	return pending;
}
const services = {
	spotify: {
		url: "https://open.spotify.com/",
		note: "",
	},
	games: {
		url: "/games.html",
		note: "",
	},
};
const frames = new Map();
let active = "spotify",
	started = false,
	initializing;
async function init() {
	if (initializing) return initializing;
	initializing = (async () => {
		await Promise.all([
			typeof window.$scramjetLoadController === "function"
				? undefined
				: loadPlayerScript("/scram/scramjet.all.js"),
			typeof window.BareMux?.BareMuxConnection === "function"
				? undefined
				: loadPlayerScript("/baremux/index.js"),
		]);
		if (!scramjet) {
			const { ScramjetController } = window.$scramjetLoadController();
			scramjet = new ScramjetController({
				files: {
					wasm: "/scram/scramjet.wasm.wasm",
					all: "/scram/scramjet.all.js",
					sync: "/scram/scramjet.sync.js",
				},
			});
		}
		if (!connection)
			connection = new window.BareMux.BareMuxConnection("/baremux/worker.js");
		await scramjet.init();
		await registerSW();
		await navigator.serviceWorker.ready;
		await connection.setTransport("/libcurl/index.mjs", [
			{
				websocket:
					(location.protocol === "https:" ? "wss:" : "ws:") +
					"//" +
					location.host +
					"/wisp/",
			},
		]);
	})().catch((error) => {
		initializing = undefined;
		throw error;
	});
	return initializing;
}
async function show(service) {
	if (!services[service]) return;
	if (service === "games") {
		location.assign("/games");
		return;
	}
	active = service;
	document.querySelector("#spotify-login").hidden = service !== "spotify";
	document
		.querySelectorAll("[data-service]")
		.forEach((b) =>
			b.classList.toggle("active", b.dataset.service === service)
		);
	document.querySelector("#service-note").textContent = services[service].note;
	if (!started && service === "spotify") return;
	started = true;
	try {
		if (service === "spotify") await init();
		let frame = frames.get(service);
		if (!frame) {
			if (service === "spotify") {
				frame = scramjet.createFrame();
			} else {
				const iframe = document.createElement("iframe");
				frame = {
					frame: iframe,
					go: (url) => {
						iframe.src = url;
					},
				};
			}
			frame.frame.title =
				service === "spotify" ? "Spotify web player" : "Games";
			frame.frame.setAttribute(
				"sandbox",
				"allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-presentation"
			);
			frame.frame.allowFullscreen = true;
			frame.frame.allow =
				"autoplay; encrypted-media; fullscreen; picture-in-picture";
			document.querySelector("#stage").append(frame.frame);
			frames.set(service, frame);
			frame.go(services[service].url);
		}
		for (const [key, item] of frames) item.frame.hidden = key !== active;
		document.querySelector(".start").hidden = true;
	} catch (error) {
		document.querySelector("#status").textContent =
			"Could not load the browser service: " + error.message;
		document.querySelector(".start").hidden = false;
	}
}
document.querySelector("#start").onclick = () => {
	started = true;
	document.querySelector("#status").textContent = "Loading…";
	show(active);
};
document
	.querySelectorAll("[data-service]")
	.forEach((b) => (b.onclick = () => show(b.dataset.service)));
document.querySelector("#reload").onclick = () => {
	if (active === "spotify") {
		// Reconnect the transport after a server deploy or suspended browser tab.
		location.assign("/?service=spotify");
		return;
	}
	const f = frames.get(active);
	if (f) f.go(services[active].url);
	else {
		started = true;
		show(active);
	}
};

// A directly opened proxy URL must initialize its transport in the site first.
if (new URLSearchParams(location.search).get("service") === "spotify") {
	document.querySelector("#start").click();
}

document.querySelector("#spotify-login").onclick = async () => {
	started = true;
	await show("spotify");
	const player = frames.get("spotify");
	if (player)
		player.go(
			"https://accounts.spotify.com/en/login?continue=" +
				encodeURIComponent("https://open.spotify.com/")
		);
};
