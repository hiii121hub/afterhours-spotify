const types = "track|album|artist|playlist|episode|show";

export function parseSpotifyLink(value) {
	const input = value.trim();
	const uri = input.match(new RegExp(`^spotify:(${types}):([A-Za-z0-9]{22})$`));
	if (uri) return { type: uri[1], id: uri[2] };
	let url;
	try { url = new URL(input); } catch { return null; }
	if (url.protocol !== "https:" || url.hostname !== "open.spotify.com" || url.port || url.username || url.password) return null;
	const match = url.pathname.match(new RegExp(`^/(?:intl-[a-zA-Z-]+/)?(?:embed/)?(${types})/([A-Za-z0-9]{22})/?$`));
	return match ? { type: match[1], id: match[2] } : null;
}

if (typeof document !== "undefined") {
	const field = document.querySelector("#spotify-link");
	const error = document.querySelector("#link-error");
	const host = document.querySelector("#spotify-player");
	function load(value) {
		const item = parseSpotifyLink(value);
		if (!item) {
			error.textContent = "Use a Spotify song, album, artist, playlist, podcast or episode link.";
			field.setAttribute("aria-invalid", "true");
			return;
		}
		error.textContent = "";
		field.removeAttribute("aria-invalid");
		field.value = `https://open.spotify.com/${item.type}/${item.id}`;
		const frame = document.createElement("iframe");
		frame.title = "Spotify player";
		frame.src = `https://open.spotify.com/embed/${item.type}/${item.id}?theme=0`;
		frame.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
		frame.allowFullscreen = true;
		// Keep links inside the embed from replacing the site or opening new tabs.
		frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-presentation");
		host.replaceChildren(frame);
	}
	document.querySelector("#spotify-form").addEventListener("submit", (event) => {
		event.preventDefault();
		load(field.value);
	});
	for (const button of document.querySelectorAll("[data-spotify]")) {
		button.addEventListener("click", () => load(button.dataset.spotify));
	}
	load("spotify:track:0VjIjW4GlUZAMYd2vXMi3b");
}
