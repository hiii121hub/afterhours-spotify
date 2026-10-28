import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import WebSocket from "ws";

test(
	"server rejects foreign origins and non-Spotify transport targets",
	{ timeout: 15000 },
	async (t) => {
		const server = spawn(process.execPath, ["src/index.js"], {
			env: {
				...process.env,
				PORT: "0",
				HOST: "127.0.0.1",
				RENDER_EXTERNAL_URL: "",
			},
			stdio: ["ignore", "pipe", "pipe"],
		});
		t.after(async () => {
			if (server.exitCode === null) {
				server.kill("SIGTERM");
				await once(server, "exit");
			}
		});
		const port = await new Promise((resolve, reject) => {
			server.once("error", reject);
			server.once("exit", (code) =>
				reject(new Error("Server exited before listening: " + code))
			);
			server.stdout.on("data", (data) => {
				const match = String(data).match(/listening on port (\d+)/);
				if (match) resolve(Number(match[1]));
			});
		});
		const base = "http://127.0.0.1:" + port;
		assert.deepEqual(await (await fetch(base + "/health")).json(), {
			status: "ok",
		});
		const homepage = await fetch(base);
		assert.equal(homepage.status, 200);
		assert.equal(homepage.headers.get("cross-origin-opener-policy"), "same-origin");
		assert.equal(homepage.headers.get("cross-origin-embedder-policy"), "require-corp");
		assert.equal((await fetch(base + "/game-builds/1.html")).status, 403);
		const direct = await fetch(
			base + "/scramjet/https%3A%2F%2Fopen.spotify.com%2F",
			{ redirect: "manual" }
		);
		assert.equal(direct.status, 302);
		assert.equal(direct.headers.get("location"), "/?service=spotify");
		const foreign = new WebSocket(base.replace("http:", "ws:") + "/wisp/", {
			origin: "https://other.example",
		});
		const status = await new Promise((resolve, reject) => {
			foreign.on("unexpected-response", (_req, res) => {
				resolve(res.statusCode);
				res.resume();
			});
			foreign.once("error", reject);
		});
		foreign.terminate();
		assert.equal(status, 403);
		const ws = new WebSocket(base.replace("http:", "ws:") + "/wisp/", {
			origin: base,
		});
		t.after(() => ws.terminate());
		await once(ws, "open");
		for (const [id, host] of [
			[1, "localhost"],
			[2, "127.0.0.1"],
			[3, "example.com"],
			[4, "spotify.com.attacker.test"],
		]) {
			const packet = Buffer.alloc(8 + Buffer.byteLength(host));
			packet[0] = 1;
			packet.writeUInt32LE(id, 1);
			packet[5] = 1;
			packet.writeUInt16LE(443, 6);
			packet.write(host, 8);
			const reply = new Promise((resolve, reject) => {
				const listener = (data) => {
					const b = Buffer.from(data);
					if (b[0] === 4 && b.readUInt32LE(1) === id) {
						ws.off("message", listener);
						resolve(b);
					}
				};
				ws.on("message", listener);
				ws.once("error", reject);
			});
			ws.send(packet);
			const closed = await reply;
			assert.equal(
				closed[5],
				0x48,
				"destination must receive the HostBlocked reason"
			);
		}
		assert.equal((await fetch(base + "/health")).status, 200);
		ws.close();
	}
);
