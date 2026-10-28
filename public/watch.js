"use strict";
document.querySelector("#play").onclick = () => {
	const iframe = document.createElement("iframe");
	iframe.src =
		"https://www.youtube-nocookie.com/embed/YvGSK8mIlt8?playsinline=1";
	iframe.title = "Solo Leveling official trailer by Crunchyroll";
	iframe.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture";
	iframe.allowFullscreen = true;
	iframe.credentialless = true;
	iframe.setAttribute(
		"sandbox",
		"allow-scripts allow-same-origin allow-presentation"
	);
	iframe.referrerPolicy = "strict-origin-when-cross-origin";
	document.querySelector("#player").replaceChildren(iframe);
	document.querySelector("#video-status").textContent =
		"Player loaded. Playback depends on the video provider.";
};
