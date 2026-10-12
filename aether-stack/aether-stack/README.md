# Aether — solo operator console

One Next.js app: accounts, plans and quotas, Paddle billing, and AI workflows
(trigger → AI step → action) with run history. Built for a one-person software
business.

## Run it

```bash
npm install
npm run dev
```

That is the whole setup. `npm run dev` first runs `npm run setup`, which
creates `.env.local` from `.env.example` and seeds a demo account, then starts
Next.js on <http://localhost:3000>.

Demo account: `demo@example.com` / `demo-password-123`

## Defaults (all work with no configuration)

| Concern | Default | Notes |
| --- | --- | --- |
| Storage | SQLite file at `.data/app.db` | Node's built-in `node:sqlite`. No server, no native build. Schema is created on first use. |
| AI provider | mock | Used automatically when no API key is set. Output is labelled `[MOCK AI — no API key set]`. |
| Billing | demo mode | `Upgrade to Pro` activates a labelled demo subscription locally instead of charging. |
| Owner account | `demo@example.com` | Set in `.env.local`. Unlimited, never billed. |
| Session | cookie `aether_session` | 30 days, HttpOnly, random token in the DB. |

## Plug in a real AI key

Add one of these to `.env.local` and restart — nothing else changes:

```
OPENAI_API_KEY="sk-..."          # or
ANTHROPIC_API_KEY="sk-ant-..."
```

`/api/health` and the dashboard show which provider is active.

## Plug in real billing (Paddle)

```
PADDLE_ENVIRONMENT="sandbox"
PADDLE_API_KEY="pdl_sdbx_apikey_..."
PADDLE_PRICE_PRO_MONTHLY="pri_..."
PADDLE_WEBHOOK_SECRET="pdl_ntfset_..."
```

Point a Paddle webhook at `POST /api/paddle/webhook`. Signature verification and
event idempotency are implemented; `subscription.activated`, `.updated` and
`.canceled` update the local subscription row.

## Commands

```bash
npm run dev        # setup (once) + dev server on :3000
npm run setup      # create .env.local, seed demo account (idempotent)
npm run seed       # alias of setup
npm run typecheck  # tsc --noEmit
npm test           # owner-bypass + workflow engine tests
npm run build      # production build
npm start          # serve the production build
```

## What works end to end

- Sign up, sign in, sign out; sessions in SQLite; rate-limited auth.
- `/dashboard` — plan, quotas, run history, AI provider check.
- `/workflows` — add a workflow from 4 templates, run it with your own input, see
  per-step output and duration, pause/enable it.
- Webhook triggers: `POST /api/hooks/lead`, `POST /api/hooks/support`.
- Plan limits enforced server-side (402 with `plan`, `used`, `limit`).
- Owner bypass: `OWNER_EMAIL` gets unlimited limits and can never be billed.
- Billing: demo activate/cancel, or real Paddle checkout + webhook.
- `/account` — export all your data as JSON, delete the account.

## Known limits

- **Schedule triggers store the cron string; nothing fires them.** Add a cron
  host (Vercel Cron, GitHub Actions, `node-cron` worker) to call
  `/api/workflows/<id>/run` on a timetable.
- **Action steps record intent, they do not send.** No email/post/ticket
  provider is wired in; the receipt is written into the run output.
- **The in-process rate limiter is per instance.** On serverless the real ceiling
  is `limit × instances`; move it to Redis for strict enforcement.
- **SQLite is single-file, single-writer.** Fine for one operator; swap
  `src/db/sqlite.ts` for Postgres before running multiple instances.
- **Paddle Nepal onboarding is unvalidated** — get KYC approved before you rely
  on payouts.
- Legal pages render with real defaults (`Demo Operator` / `support@example.com`);
  replace them in `.env.local` with your registered entity before going live.
