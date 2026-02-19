# Sensei Suki Cloudflare + Firebase Stack

## Structure

- `apps/web`: Next.js frontend (Cloudflare Pages target)
- `workers/api`: Cloudflare Worker API (OpenAI + content endpoints)
- `content/seed`: editable JSON seed for lessons, games, videos
- `firebase`: Firestore rules/indexes

## Local development

Use Firebase web env values in `/Users/phill/Documents/Japanese Sensei Suki/apps/web/.env.local`.

1. Install frontend deps:

```bash
cd apps/web
npm install
npm run dev
```

2. Install worker deps and run locally:

```bash
cd workers/api
npm install
npm run dev
```

## Deploy sequence

1. Create R2 bucket `sensei-suki-content`.
2. Upload seed JSON files to R2 keys:
- `seed/lessons.json`
- `seed/games.json`
- `seed/videos.json`
3. Configure Worker secrets/vars:

```bash
cd workers/api
wrangler secret put OPENAI_API_KEY
wrangler deploy
```

4. Deploy web app to Cloudflare Pages (build command: `npm run build`, output handled by Next adapter).
5. Point web env `NEXT_PUBLIC_API_BASE_URL` to Worker URL.

## Current Firebase project

- `projectId`: `takeo-tomodachi`
- `authDomain`: `takeo-tomodachi.firebaseapp.com`
- `storageBucket`: `takeo-tomodachi.firebasestorage.app`

## Easy content workflow

1. Add/modify JSON in `content/seed`.
2. Re-upload JSON to R2 `seed/` keys.
3. No code change required for new lessons/videos/wordfind entries.

## Current live endpoint

- Worker URL: `https://sensei-suki-api.phill-carter.workers.dev`
- Health check: `GET /health` is live.
- Chat endpoint currently returns OpenAI `insufficient_quota` until billing/quota is enabled on your OpenAI project key.

## R2 status

R2 is not enabled on this Cloudflare account yet. The current Worker build serves bundled seed content so the app can run now. After enabling R2 in Cloudflare Dashboard, re-add the R2 binding in `wrangler.toml`.

## Next implementation steps

- Add Firebase sign-in UI and route guards.
- Add Worker token verification for Firebase ID tokens.
- Add admin UI for uploading videos to R2 directly.
