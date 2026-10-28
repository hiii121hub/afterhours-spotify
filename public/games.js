"use strict";
fetch("/game-audit.json")
	.then((r) => r.json())
	.then((games) => {
		const grid = document.querySelector("#games");
		for (const game of games) {
			const card = document.createElement("article");
			card.className = "card";
			const number = document.createElement("div");
			number.className = "number";
			number.textContent = String(game.id).padStart(2, "0");
			const title = document.createElement("h2");
			title.textContent = game.name;
			const author = document.createElement("p");
			author.textContent = game.author;
			const status = document.createElement("span");
			status.className = "status";
			status.textContent =
				game.id === 9 ? "Original project private" : "Permission unverified";
			const details = document.createElement("details");
			const summary = document.createElement("summary");
			summary.textContent = "Source and test status";
			details.append(summary);
			for (const text of [
				game.permission,
				"Catalog ID: " + game.id,
				"Loader: " + game.url,
				"Cover: " + game.cover,
				"External dependency hosts: " +
					[
						...new Set(
							game.externalUrls.map((url) => {
								try {
									return new URL(url).hostname;
								} catch {
									return "";
								}
							})
						),
					]
						.filter(Boolean)
						.join(", "),
				"Gameplay, controls, fullscreen, mobile: not tested",
			]) {
				const p = document.createElement("p");
				p.textContent = text;
				details.append(p);
			}
			card.append(number, title, author, status, details);
			grid.append(card);
		}
	})
	.catch(() => {
		document.querySelector("#games").textContent =
			"The game report could not be loaded. Please reload.";
	});
