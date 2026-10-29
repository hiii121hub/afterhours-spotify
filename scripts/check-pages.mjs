import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
const output = path.resolve(
	process.env.PAGES_OUTPUT || "dist/afterhours-spotify"
);
const segment = (process.env.PAGES_BASE_PATH ?? "afterhours-spotify").replace(
	/^\/+|\/+$/g,
	""
);
const base = segment ? "/" + segment + "/" : "/";
const games = JSON.parse(
	await readFile(path.join(output, "game-audit.json"), "utf8")
);
assert.equal(games.length, 7);
for (const game of games) {
	assert.equal(
		game.launchUrl.split("?")[0],
		base + "game-builds/" + game.id + ".html"
	);
	for (const url of [game.launchUrl, game.localCover]) {
		assert.ok(url.startsWith(base));
		assert.ok(
			(
				await stat(path.join(output, url.split("?")[0].slice(base.length)))
			).isFile()
		);
	}
	const html = await readFile(
		path.join(output, "game-builds", game.id + ".html"),
		"utf8"
	);
	assert.doesNotMatch(
		html,
		/["']\/(ovo2|ovo3|gladihoppers|sprunki|stickman-hook)\//
	);
}
for (const file of ["index.html", "spotify.html", "games.js"]) {
	const contents = await readFile(path.join(output, file), "utf8");
	assert.doesNotMatch(contents, /onrender\.com|\/scram\/|\/wisp\//);
}
assert.doesNotMatch(
	await readFile(path.join(output, "spotify.html"), "utf8"),
	/<input|password|accounts\.spotify\.com/
);
console.log(
	"Pages build checked: seven game URLs/covers, project paths, and no Render/proxy dependencies."
);
