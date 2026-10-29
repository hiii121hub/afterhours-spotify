import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const output = path.resolve(
	root,
	process.env.PAGES_OUTPUT || "dist/afterhours-spotify"
);
const segment = (process.env.PAGES_BASE_PATH ?? "afterhours-spotify").replace(
	/^\/+|\/+$/g,
	""
);
const base = segment ? "/" + segment + "/" : "/";
const gameBase = base + "game-builds/";
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of [
	"index.css",
	"media.css",
	"games.js",
	"game-audit.json",
	"game-covers",
	"source.tar.gz",
	"game-builds",
	"spotify-pages.js",
	"spotify-pages.css",
	"music.js",
	"music.css",
]) {
	await cp(path.join(root, "public", name), path.join(output, name), {
		recursive: true,
	});
}
// Pages project sites live below /repository/. Rebase only root-relative
// local asset paths; upstream SDKs and provider checks remain untouched.
async function rebase(directory) {
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const file = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			await rebase(file);
			continue;
		}
		if (!/\.(?:html|js|mjs|css|json|xml)$/i.test(entry.name)) continue;
		let source = await readFile(file, "utf8");
		source = source.replace(
			/(["'`(=])\/(ovo2|ovo3|gladihoppers|sprunki|stickman-hook)\//g,
			(_match, before, name) => before + gameBase + name + "/"
		);
		source = source.replace(
			/(["'`])\/(touch-controls\.js|ovo2-render\.js)/g,
			(_match, before, name) => before + gameBase + name
		);
		await writeFile(file, source);
	}
}
await rebase(path.join(output, "game-builds"));
const catalog = JSON.parse(
	await readFile(path.join(output, "game-audit.json"), "utf8")
);
for (const game of catalog) {
	game.launchUrl = gameBase + game.id + ".html?v=github-pages";
	game.localCover = base + "game-covers/" + game.id + ".png";
}
await writeFile(
	path.join(output, "game-audit.json"),
	JSON.stringify(catalog, null, 2) + "\n"
);
let gamesScript = await readFile(path.join(output, "games.js"), "utf8");
gamesScript = gamesScript.replace(
	'fetch("/game-audit.json")',
	'fetch("' + base + 'game-audit.json")'
);
gamesScript = gamesScript.replace(
	"// A distinct game origin keeps scripts separate from Spotify account storage.",
	"// This static build has no account sign-in or account storage."
);
await writeFile(path.join(output, "games.js"), gamesScript);
const navigation = (active) =>
	`<header><nav aria-label="Services"><a href="${base}music.html"${active === "music" ? ' class="active" aria-current="page"' : ""}>Music</a><a href="${base}spotify.html"${active === "spotify" ? ' class="active" aria-current="page"' : ""}>Spotify</a><a href="${base}"${active === "games" ? ' class="active" aria-current="page"' : ""}>Games</a></nav>${active === "games" ? '<button id="catalog-reload" aria-label="Reload games">↻</button>' : ""}</header><div class="notice"><a href="${base}source.tar.gz" download>Source</a></div>`;
let html = await readFile(path.join(root, "public/games.html"), "utf8");
html = html
	.replace(
		'<link rel="stylesheet" href="media.css" />',
		`<link rel="icon" href="data:,"><link rel="stylesheet" href="${base}index.css"><link rel="stylesheet" href="${base}media.css">`
	)
	.replace("<body>", '<body class="games-page">' + navigation("games"))
	.replace("<main>", '<main id="stage">')
	.replace('src="games.js"', `src="${base}games.js"`);
await writeFile(path.join(output, "index.html"), html);
const spotifyPage = (await readFile(path.join(root, "public/spotify-pages.html"), "utf8"))
	.replaceAll("{{base}}", base)
	.replace("{{navigation}}", navigation("spotify"));
await writeFile(path.join(output, "spotify.html"), spotifyPage);
const musicPage = (await readFile(path.join(root, "public/music.html"), "utf8"))
	.replaceAll("{{base}}", base)
	.replace("{{navigation}}", navigation("music"));
await writeFile(path.join(output, "music.html"), musicPage);
await writeFile(path.join(output, ".nojekyll"), "");
await writeFile(
	path.join(output, "404.html"),
	`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Page not found</title><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${base}index.css"></head><body><main class="start"><h1>Page not found</h1><a href="${base}">Games</a></main></body></html>`
);
console.log("Built GitHub Pages site:", output, "base:", base);
