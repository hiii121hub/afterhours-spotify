"use strict";
const grid = document.querySelector("#games"),
	dialog = document.querySelector("#game-dialog"),
	shell = document.querySelector("#game-shell");
let current, frame, returnFocus;
const controls = {
	1: "Arrow keys: move, jump and crouch.",
	2: "Arrow keys: move, jump and crouch.",
	3: "Arrow keys: move, jump and crouch.",
	4: "WASD to move, Space to change stance, arrow keys to attack.",
	5: "Left/right arrows to steer. Use Restart after falling.",
	9: "Drag sound icons onto characters.",
	11: "Click, tap or hold Space to swing.",
};
function mount() {
	frame?.remove();
	frame = document.createElement("iframe");
	frame.src = current.launchUrl;
	frame.title = current.name + " game";
	frame.allow = "autoplay; fullscreen; gamepad";
	frame.allowFullscreen = true;
	frame.credentialless = true;
	// A distinct game origin keeps scripts separate from Spotify account storage.
	frame.setAttribute(
		"sandbox",
		"allow-scripts allow-same-origin allow-pointer-lock allow-orientation-lock"
	);
	frame.addEventListener("load", () => {
		frame.focus();
		document.querySelector("#game-message").textContent =
			current.note || controls[current.id];
	});
	document.querySelector("#game-frame").replaceChildren(frame);
	document.querySelector("#game-message").textContent =
		"Loading " + current.name + "…";
}
function openGame(game, button) {
	current = game;
	returnFocus = button;
	document.querySelector("#game-title").textContent = game.name;
	document.querySelector("#game-controls").textContent = controls[game.id];
	dialog.showModal();
	mount();
}
document.querySelector("#game-close").onclick = () => dialog.close();
dialog.addEventListener("close", () => {
	if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
	frame?.remove();
	frame = null;
	current = null;
	returnFocus?.focus();
});
document.querySelector("#game-reload").onclick = () => {
	if (current) mount();
};
document.querySelector("#game-fullscreen").onclick = async () => {
	try {
		if (document.fullscreenElement) await document.exitFullscreen();
		else await shell.requestFullscreen();
	} catch {
		document.querySelector("#game-message").textContent =
			"Fullscreen is unavailable in this browser.";
	}
};
fetch("/game-audit.json")
	.then((r) => {
		if (!r.ok) throw Error();
		return r.json();
	})
	.then((games) => {
		for (const game of games) {
			const card = document.createElement("article");
			card.className = "card game-card";
			const image = document.createElement("img");
			image.src = game.localCover;
			image.alt = "";
			image.loading = "lazy";
			const copy = document.createElement("div");
			copy.className = "game-card-copy";
			const title = document.createElement("h2");
			title.textContent = game.name;
			const author = document.createElement("p");
			author.textContent = game.author;
			const status = document.createElement("span");
			status.className = "status";
			status.textContent = game.playable
				? "Gameplay tested"
				: game.status === "broken"
					? "Unavailable"
					: "Testing";
			const note = document.createElement("p");
			note.textContent = game.note || controls[game.id];
			const button = document.createElement("button");
			button.textContent = game.playable ? "Play" : "Open";
			button.setAttribute(
				"aria-label",
				(game.playable ? "Play " : "Open ") + game.name
			);
			if (game.status === "broken" || game.status === "sdk-review") {
				button.disabled = true;
				button.textContent = "Unavailable";
			}
			button.onclick = () => openGame(game, button);
			copy.append(title, author, status, note, button);
			card.append(image, copy);
			grid.append(card);
		}
	})
	.catch(() => {
		grid.textContent = "The game list could not load. Please reload.";
	});
