# Website editor setup

The editor lives at <https://thenumbercrunch.com/admin/>. It writes Markdown and
media to GitHub through Decap CMS. Editorial saves become pull requests; publishing
merges into `main`, which triggers the existing production deployment.

## One-time authentication setup

Run:

```sh
./scripts/setup_admin_auth.sh
```

The wizard creates the GitHub OAuth connection and deploys the authentication
worker to `auth.thenumbercrunch.com`. The OAuth secret is sent directly to
Cloudflare and is never written to this repository.

The GitHub OAuth application must use:

- Homepage: `https://thenumbercrunch.com/admin/`
- Callback: `https://auth.thenumbercrunch.com/callback`

Only `pathak-ashutosh` is accepted. The worker also confirms push permission to
`pathak-ashutosh/thenumbercrunch` before returning a token to the editor.

## Authoring

1. Open `/admin/` and choose **Login with GitHub**.
2. Create a post or open an existing one.
3. Insert interactive blocks from the editor toolbar. All six live shortcodes are
   registered: chart, function lab, stepper, system map, model race, and caucus atlas.
4. Save to create or update an editorial pull request.
5. Open the **Preview** status for the exact Hugo-rendered draft.
6. Publish to merge the pull request and trigger the normal VPS deployment.

The JSON field in each interactive block is validated before save. Its full schema
remains documented in `INTERACTIVE_POSTS.md`.

## Local checks

```sh
node scripts/test_admin_editor.mjs
node --test oauth-worker/test/*.test.js
hugo --minify --gc --buildDrafts
```

Local CMS development can use Decap's proxy backend after starting Hugo and a
local proxy. Production always uses GitHub OAuth.
