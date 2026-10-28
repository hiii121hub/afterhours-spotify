import { createServer } from "node:http";
import { fileURLToPath } from "url";
import {
	allowedHosts,
	resolveDestination,
	isAllowedUpgrade,
} from "./access.js";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";

import { scramjetPath } from "@mercuryworkshop/scramjet/path";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";

const publicPath = fileURLToPath(new URL("../public/", import.meta.url));

logging.set_level(
	process.env.TRANSPORT_DIAGNOSTICS === "1" ? logging.WARN : logging.NONE
);
Object.assign(wisp.options, {
	allow_udp_streams: false,
	allow_direct_ip: false,
	allow_private_ips: false,
	allow_loopback_ips: false,
	hostname_whitelist: allowedHosts,
	port_whitelist: [443],
	stream_limit_total: 64,
	// wisp-js 0.4.1 per-host limiting iterates a plain object and crashes.
	// Keep its working per-connection total limit, plus our server connection caps.
	stream_limit_per_host: -1,
	dns_method: resolveDestination,
});
const connections = new Set();

const fastify = Fastify({
	serverFactory: (handler) => {
		return createServer()
			.on("request", (req, res) => {
				res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
				res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
				res.setHeader("X-Content-Type-Options", "nosniff");
				res.setHeader("Referrer-Policy", "same-origin");
				handler(req, res);
			})
			.on("upgrade", (req, socket, head) => {
				const publicOrigin =
					process.env.RENDER_EXTERNAL_URL || `http://${req.headers.host}`;
				if (!isAllowedUpgrade(req, publicOrigin)) {
					socket.end("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
					return;
				}
				if (connections.size >= 64) {
					socket.end(
						"HTTP/1.1 429 Too Many Requests\r\nConnection: close\r\n\r\n"
					);
					return;
				}
				connections.add(socket);
				socket.on("close", () => {
					connections.delete(socket);
				});
				wisp.routeRequest(req, socket, head);
			});
	},
});

fastify.get("/health", async () => ({ status: "ok" }));
// Execute game builds only on the dedicated game origin, never beside Spotify storage.
fastify.get("/game-builds/*", async (_request, reply) =>
	reply
		.code(403)
		.type("text/plain")
		.send("Game builds run on the separate game host.")
);
// Without a controlling service worker, proxy URLs cannot load on their own.
fastify.get("/scramjet/*", async (_request, reply) =>
	reply.redirect("/?service=spotify")
);

fastify.register(fastifyStatic, {
	root: publicPath,
	decorateReply: true,
});

fastify.register(fastifyStatic, {
	root: scramjetPath,
	prefix: "/scram/",
	decorateReply: false,
});

fastify.register(fastifyStatic, {
	root: libcurlPath,
	prefix: "/libcurl/",
	decorateReply: false,
});

fastify.register(fastifyStatic, {
	root: baremuxPath,
	prefix: "/baremux/",
	decorateReply: false,
});

fastify.setNotFoundHandler((res, reply) => {
	return reply.code(404).type("text/html").sendFile("404.html");
});

fastify.server.on("listening", () => {
	console.log(`Afterhours listening on port ${fastify.server.address().port}`);
});
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
let closing = false;
async function shutdown() {
	if (closing) return;
	closing = true;
	for (const socket of connections) socket.destroy();
	await fastify.close();
	process.exitCode = 0;
}

let port = parseInt(process.env.PORT || "");

if (isNaN(port)) port = 8080;

fastify.listen({
	port: port,
	host: process.env.HOST || "127.0.0.1",
});
