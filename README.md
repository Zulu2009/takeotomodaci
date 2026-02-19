# Japanese Sensei Suki (MVP)

## New Cloudflare + Firebase scaffold

A new implementation scaffold is now included:

- `/Users/phill/Documents/Japanese Sensei Suki/apps/web`
- `/Users/phill/Documents/Japanese Sensei Suki/workers/api`
- `/Users/phill/Documents/Japanese Sensei Suki/firebase`
- `/Users/phill/Documents/Japanese Sensei Suki/content/seed`

Setup and deployment instructions are in:

- `/Users/phill/Documents/Japanese Sensei Suki/STACK-SETUP.md`

Next.js 14 + TypeScript + Tailwind web app with:
- Japanese tutor chat UI with session message history
- `/api/chat` server route using OpenAI Responses API
- System constraints: max 5 new items/session, kana + romaji + English, end with 3 recall questions
- Local progress tracking (known vocab + known kanji) in localStorage
- Lesson mode Day 1 to Day 30
- Reset progress + export progress JSON

## 1. Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 2. Environment variables

Set in `.env.local`:

```bash
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
```

Important: API key is used only on server in `app/api/chat/route.ts`.

## 3. Deploy to Vercel (recommended)

1. Push this repo to GitHub.
2. In Vercel, import the repo.
3. Add env vars `OPENAI_API_KEY` and `OPENAI_MODEL`.
4. Deploy.
5. In Vercel Domains, add `app.yko.earth` and update DNS at Cloudflare.

## 4. Cloudflare + Vercel DNS setup

If Cloudflare manages DNS for `yko.earth`:
1. Keep nameservers pointed to Cloudflare.
2. In Vercel, add domain `app.yko.earth`.
3. In Cloudflare DNS, create `CNAME`:
   - Name: `app`
   - Target: `cname.vercel-dns.com`
4. Enable proxy as needed (DNS-only is easiest first).

## 5. Supabase (optional in this MVP)

Current MVP stores progress in localStorage only (no DB required).

Use Supabase later when you want:
- parent/child accounts
- sync progress across devices
- uploaded books/videos storage

When ready, create a Supabase project and add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)

## 6. Key files

- `app/page.tsx` UI + lesson mode + chat flow
- `app/api/chat/route.ts` OpenAI call and tutor constraints
- `lib/lesson-prompts.ts` Day 1 to Day 30 prompt topics
- `lib/use-local-progress.ts` localStorage progress/reset/export
- `tailwind.config.ts` Tailwind setup

## 7. Notes

- This MVP has no auth and no cloud persistence by design for speed.
- For child safety at production scale, add stronger moderation + parent controls + logs.
# takeotomodaci
# takeotomodaci
