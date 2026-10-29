export function youtubeId(value) {
	let url;
	try { url = new URL(value.trim()); } catch { return null; }
	if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
	const hosts = ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be", "www.youtube-nocookie.com"];
	if (!hosts.includes(url.hostname)) return null;
	let id;
	if (url.hostname === "youtu.be") id = url.pathname.slice(1);
	else if (url.pathname === "/watch") id = url.searchParams.get("v");
	else id = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)\/?$/)?.[1];
	return /^[\w-]{11}$/.test(id || "") ? id : null;
}

if (typeof document !== "undefined") {
	const queue = [{ id: "K4DyBUG242c", title: "Cartoon, Jéja — On & On (feat. Daniel Levi)" }];
	let current = 0;
	let player;
	let ready = false;
	const status = document.querySelector("#music-status");
	const field = document.querySelector("#music-link");
	const list = document.querySelector("#queue");
	const previous = document.querySelector("#previous");
	const next = document.querySelector("#next");
	function render() {
		list.replaceChildren();
		queue.forEach((item, index) => {
			const row = document.createElement("li");
			const play = document.createElement("button");
			play.className = "queue-play";
			play.disabled = !ready;
			play.textContent = item.title;
			play.setAttribute("aria-current", String(index === current));
			play.addEventListener("click", () => select(index));
			const remove = document.createElement("button");
			remove.className = "queue-remove";
			remove.disabled = !ready;
			remove.textContent = "×";
			remove.setAttribute("aria-label", "Remove " + item.title);
			remove.addEventListener("click", () => {
				const wasCurrent = index === current;
				queue.splice(index, 1);
				if (index < current) current--;
				if (wasCurrent) {
					current = Math.min(index, queue.length - 1);
					if (current >= 0) select(current, false);
					else { player?.stopVideo(); status.textContent = "Queue empty. Add a YouTube link."; }
				}
				render();
			});
			row.append(play, remove);
			list.append(row);
		});
		document.querySelector("#queue-count").textContent = String(queue.length);
		previous.disabled = !ready || current <= 0;
		next.disabled = !ready || current >= queue.length - 1;
	}
	function select(index, autoplay = true) {
		if (!ready) { status.textContent = "Player is loading. Try again in a moment."; return; }
		current = index;
		status.textContent = "";
		if (autoplay) player.loadVideoById(queue[index].id);
		else player.cueVideoById(queue[index].id);
		render();
	}
	document.querySelector("#music-form").addEventListener("submit", (event) => {
		event.preventDefault();
		const id = youtubeId(field.value);
		if (!id) { status.textContent = "Paste a YouTube or YouTube Music song/video link, not a playlist or search page."; field.setAttribute("aria-invalid", "true"); return; }
		if (queue.length >= 50) { status.textContent = "Queue is full. Remove a video first."; return; }
		field.removeAttribute("aria-invalid");
		queue.push({ id, title: "Video · " + id });
		field.value = "";
		if (current < 0) select(0, false);
		else { status.textContent = "Added to queue. Select it to play."; render(); }
	});
	previous.addEventListener("click", () => select(current - 1));
	next.addEventListener("click", () => select(current + 1));
	const frame = document.createElement("iframe");
	frame.id = "youtube-player";
	frame.title = "YouTube music player";
	frame.src = "https://www.youtube.com/embed/" + queue[0].id + "?enablejsapi=1&playsinline=1&origin=" + encodeURIComponent(location.origin);
	frame.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture";
	frame.allowFullscreen = true;
	frame.referrerPolicy = "strict-origin-when-cross-origin";
	frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-presentation");
	document.querySelector("#video-host").append(frame);
	window.onYouTubeIframeAPIReady = () => {
		player = new YT.Player("youtube-player", { events: {
			onReady: () => { ready = true; status.textContent = ""; render(); },
			onStateChange: (event) => { if (event.data === YT.PlayerState.ENDED && current < queue.length - 1) select(current + 1); },
			onError: (event) => {
				const messages = { 2: "This video link is invalid.", 5: "Playback failed in this browser.", 100: "This video is unavailable or private.", 101: "The uploader does not allow this video to play on other sites.", 150: "The uploader does not allow this video to play on other sites.", 153: "YouTube could not verify the site. Reload this page." };
				status.textContent = (messages[event.data] || "YouTube cannot play this video here.") + " Try another video or Next.";
			},
		} });
	};
	const api = document.createElement("script");
	api.src = "https://www.youtube.com/iframe_api";
	api.onerror = () => { status.textContent = "Queue controls could not load. The YouTube player's own controls may still work."; };
	document.head.append(api);
	document.addEventListener("visibilitychange", () => { if (document.hidden && ready) player.pauseVideo(); });
	status.textContent = "Loading YouTube…";
	render();
}
