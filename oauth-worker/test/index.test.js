import assert from "node:assert/strict";
import test from "node:test";

import { handleRequest } from "../src/index.js";

const env = {
  CMS_ORIGIN: "https://thenumbercrunch.com",
  GITHUB_ALLOWED_LOGIN: "pathak-ashutosh",
  GITHUB_CLIENT_ID: "client-id",
  GITHUB_CLIENT_SECRET: "client-secret",
  GITHUB_REPOSITORY: "pathak-ashutosh/thenumbercrunch",
  GITHUB_REPO_PRIVATE: "false",
};

const deterministicCrypto = {
  getRandomValues(bytes) {
    bytes.fill(7);
    return bytes;
  },
};

test("auth redirects to GitHub with a secure state cookie", async () => {
  const response = await handleRequest(
    new Request("https://auth.thenumbercrunch.com/auth?provider=github"),
    env,
    { crypto: deterministicCrypto }
  );

  assert.equal(response.status, 302);
  const destination = new URL(response.headers.get("location"));
  assert.equal(destination.origin, "https://github.com");
  assert.equal(destination.searchParams.get("client_id"), "client-id");
  assert.equal(destination.searchParams.get("redirect_uri"), "https://auth.thenumbercrunch.com/callback");
  assert.equal(destination.searchParams.get("scope"), "public_repo read:user");
  assert.match(response.headers.get("set-cookie"), /HttpOnly; Secure; SameSite=Lax/);
});

test("callback rejects a mismatched state before exchanging a token", async () => {
  let called = false;
  const response = await handleRequest(
    new Request("https://auth.thenumbercrunch.com/callback?code=code&state=wrong", {
      headers: { Cookie: "__Host-decap_oauth_state=expected" },
    }),
    env,
    { fetch: async () => { called = true; } }
  );

  assert.equal(response.status, 403);
  assert.equal(called, false);
});

test("callback verifies the account and repository permission", async () => {
  const requests = [];
  const fetch = async (url) => {
    requests.push(String(url));
    if (url === "https://github.com/login/oauth/access_token") {
      return Response.json({ access_token: "github-token" });
    }
    if (url === "https://api.github.com/user") return Response.json({ login: "pathak-ashutosh" });
    if (url === "https://api.github.com/repos/pathak-ashutosh/thenumbercrunch") {
      return Response.json({ permissions: { push: true } });
    }
    throw new Error(`Unexpected URL ${url}`);
  };

  const response = await handleRequest(
    new Request("https://auth.thenumbercrunch.com/callback?code=code&state=expected", {
      headers: { Cookie: "__Host-decap_oauth_state=expected" },
    }),
    env,
    { fetch }
  );

  assert.equal(response.status, 200);
  assert.deepEqual(requests, [
    "https://github.com/login/oauth/access_token",
    "https://api.github.com/user",
    "https://api.github.com/repos/pathak-ashutosh/thenumbercrunch",
  ]);
  assert.match(await response.text(), /authorization:github:success/);
  assert.match(response.headers.get("content-security-policy"), /default-src 'none'/);
});

test("callback refuses every other GitHub account", async () => {
  const fetch = async (url) => {
    if (url === "https://github.com/login/oauth/access_token") return Response.json({ access_token: "token" });
    return Response.json({ login: "someone-else" });
  };
  const response = await handleRequest(
    new Request("https://auth.thenumbercrunch.com/callback?code=code&state=expected", {
      headers: { Cookie: "__Host-decap_oauth_state=expected" },
    }),
    env,
    { fetch }
  );
  assert.equal(response.status, 403);
});
