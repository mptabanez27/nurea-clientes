import assert from "node:assert/strict";

const base = process.env.PORTAL_BASE_URL || "http://localhost:3002";
const user = process.env.ADMIN_USER;
const password = process.env.ADMIN_PASSWORD;
if (!user || !password) throw new Error("Configure ADMIN_USER e ADMIN_PASSWORD para o smoke test.");

async function expectStatus(path, options, status) {
  const response = await fetch(new URL(path, base), options);
  assert.equal(response.status, status, `${path}: esperado ${status}, recebido ${response.status}`);
  return response;
}

await expectStatus("/api/clients", {}, 401);
await expectStatus("/api/workspace?clientId=teste", {}, 401);
await expectStatus("/api/contents", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }, 401);
await expectStatus("/api/upload", { method: "POST" }, 401);

const login = await expectStatus("/api/admin/login", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ user, password }),
}, 200);
const cookie = login.headers.get("set-cookie")?.split(";")[0];
assert.ok(cookie, "Login não retornou cookie de sessão.");

const clientsResponse = await expectStatus("/api/clients", { headers: { Cookie: cookie } }, 200);
const clients = await clientsResponse.json();
assert.ok(clients.length >= 2, "O teste de isolamento precisa de pelo menos dois clientes.");
const tokenHeaders = { "x-nurea-client-token": clients[0].access_token };

await expectStatus(`/api/workspace?clientId=${encodeURIComponent(clients[0].id)}&monthKey=2026-09`, { headers: tokenHeaders }, 200);
await expectStatus(`/api/workspace?clientId=${encodeURIComponent(clients[1].id)}&monthKey=2026-09`, { headers: tokenHeaders }, 403);
await expectStatus("/api/contents", {
  method: "POST", headers: { ...tokenHeaders, "Content-Type": "application/json" }, body: "{}",
}, 401);

console.log("Autorização: sessão da equipe, link próprio e isolamento entre clientes conferidos.");
