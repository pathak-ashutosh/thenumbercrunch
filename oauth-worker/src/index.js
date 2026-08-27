const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_API_URL = "https://api.github.com";
const STATE_COOKIE = "__Host-decap_oauth_state";

function required(env, name) {
  const value = env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function base64Url(bytes) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomState(cryptoImpl) {
  const bytes = new Uint8Array(32);
  cryptoImpl.getRandomValues(bytes);
  return base64Url(bytes);
}

function cookieValue(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  for (const part of cookie.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return "";
}

function sameValue(left, right) {
  if (!left || !right || left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function securityHeaders(extra = {}) {
  return {
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    ...extra,
  };
}

function errorResponse(message, status = 400) {
  return new Response(message, {
    status,
    headers: securityHeaders({ "Content-Type": "text/plain; charset=utf-8" }),
  });
}

function callbackUrl(url) {
  return `${url.origin}/callback`;
}

async function beginAuth(request, env, dependencies) {
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider");
  if (provider && provider !== "github") return errorResponse("Invalid provider");

  const state = randomState(dependencies.crypto);
  const scope = env.GITHUB_REPO_PRIVATE === "true" ? "repo read:user" : "public_repo read:user";
  const authorize = new URL(GITHUB_AUTHORIZE_URL);
  authorize.searchParams.set("client_id", required(env, "GITHUB_CLIENT_ID"));
  authorize.searchParams.set("redirect_uri", callbackUrl(url));
  authorize.searchParams.set("scope", scope);
  authorize.searchParams.set("state", state);

  return new Response(null, {
    status: 302,
    headers: securityHeaders({
      Location: authorize.toString(),
      "Set-Cookie": `${STATE_COOKIE}=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    }),
  });
}

async function githubJson(fetchImpl, url, token) {
  const response = await fetchImpl(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "thenumbercrunch-decap-oauth",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) throw new Error(`GitHub request failed: ${response.status}`);
  return response.json();
}

async function exchangeCode(fetchImpl, env, code, redirectUri) {
  const response = await fetchImpl(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "thenumbercrunch-decap-oauth",
    },
    body: JSON.stringify({
      client_id: required(env, "GITHUB_CLIENT_ID"),
      client_secret: required(env, "GITHUB_CLIENT_SECRET"),
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!response.ok) throw new Error(`Token exchange failed: ${response.status}`);
  const payload = await response.json();
  if (!payload.access_token) throw new Error(payload.error_description || payload.error || "Token exchange failed");
  return payload.access_token;
}

function successPage(token, cmsOrigin) {
  const successMessage = JSON.stringify(`authorization:github:success:${JSON.stringify({ token, provider: "github" })}`).replace(/</g, "\\u003c");
  const origin = JSON.stringify(cmsOrigin).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>GitHub authorized</title></head>
  <body>
    <p>Authorization complete. This window will close.</p>
    <script>
      (() => {
        const cmsOrigin = ${origin};
        const success = ${successMessage};
        const receive = (event) => {
          if (event.origin !== cmsOrigin || event.source !== window.opener) return;
          window.opener.postMessage(success, cmsOrigin);
          window.removeEventListener("message", receive);
          window.close();
        };
        window.addEventListener("message", receive);
        window.opener.postMessage("authorizing:github", cmsOrigin);
      })();
    </script>
  </body>
</html>`;
}

async function finishAuth(request, env, dependencies) {
  const url = new URL(request.url);
  if (url.searchParams.get("error")) return errorResponse("GitHub authorization was denied", 403);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = cookieValue(request, STATE_COOKIE);
  if (!code || !sameValue(state, storedState)) return errorResponse("Invalid OAuth state", 403);

  try {
    const token = await exchangeCode(dependencies.fetch, env, code, callbackUrl(url));
    const user = await githubJson(dependencies.fetch, `${GITHUB_API_URL}/user`, token);
    if (String(user.login || "").toLowerCase() !== required(env, "GITHUB_ALLOWED_LOGIN").toLowerCase()) {
      return errorResponse("This GitHub account is not allowed", 403);
    }

    const repository = await githubJson(
      dependencies.fetch,
      `${GITHUB_API_URL}/repos/${required(env, "GITHUB_REPOSITORY")}`,
      token
    );
    if (!repository.permissions || !repository.permissions.push) return errorResponse("Repository write access is required", 403);

    return new Response(successPage(token, required(env, "CMS_ORIGIN")), {
      headers: securityHeaders({
        "Content-Type": "text/html; charset=utf-8",
        "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'none'; img-src 'none'; base-uri 'none'; frame-ancestors 'none'",
        "Set-Cookie": `${STATE_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
      }),
    });
  } catch (error) {
    console.error("OAuth callback failed", error instanceof Error ? error.message : "unknown error");
    return errorResponse("GitHub authorization failed", 502);
  }
}

export async function handleRequest(request, env, dependencies = {}) {
  const deps = {
    crypto: dependencies.crypto || globalThis.crypto,
    fetch: dependencies.fetch || globalThis.fetch,
  };
  const url = new URL(request.url);
  if (request.method !== "GET") return errorResponse("Method not allowed", 405);
  if (url.pathname === "/auth") return beginAuth(request, env, deps);
  if (url.pathname === "/callback") return finishAuth(request, env, deps);
  if (url.pathname === "/health") return new Response("ok", { headers: securityHeaders() });
  return errorResponse("Not found", 404);
}

export default {
  fetch(request, env) {
    return handleRequest(request, env);
  },
};
