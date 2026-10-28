importScripts("/scram/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

async function handleRequest(event) {
	await scramjet.loadConfig();
	if (scramjet.route(event)) {
		if (event.request.destination === "document") {
			return Response.redirect(
				new URL("/?service=spotify", event.request.url).href,
				302
			);
		}
		const response = await scramjet.fetch(event);
		// Scramjet adds COOP to every proxied response when the outer app is
		// isolated. COOP on a sandboxed iframe navigation becomes a browser
		// network error. Keep the outer app's COOP and this response's COEP;
		// omit only the proxy-added opener header for iframe documents.
		if (event.request.destination === "iframe") {
			const headers = new Headers(response.headers);
			headers.delete("Cross-Origin-Opener-Policy");
			return new Response(response.body, {
				status: response.status,
				statusText: response.statusText,
				headers,
			});
		}
		return response;
	}
	return fetch(event.request);
}

self.addEventListener("fetch", (event) => {
	event.respondWith(handleRequest(event));
});

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
	event.waitUntil(self.clients.claim())
);
