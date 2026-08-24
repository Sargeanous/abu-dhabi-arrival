# SettleSide

SettleSide is a TanStack Start app for an end-to-end relocation assistant. The current app includes the Lovable-built frontend plus an MVP backend for inquiries, provider onboarding, catalog operations, CSV imports, service-provider data, and health checks.

## Local Development

```bash
npm install
npm run dev
```

`package-lock.json` is committed on purpose: production Docker builds run `npm ci` against it so deploys use exactly the dependency versions verified locally. Don't delete it or install with `--no-package-lock`.

The dev server prints the local URL, usually `http://localhost:5173`.

## Backend Endpoints

- `GET /api/health` - app and backend health check.
- `GET /api/catalog?destination=Abu%20Dhabi` - product/catalog options for the destination.
- `GET /api/services?destination=Abu%20Dhabi` - service marketplace options and connector roadmap.
- `POST /api/inquiries` - public lead capture endpoint used by the inquiry form.
- `POST /api/intake` - AI move intake parser. Body: `{ "description": "free text about the move" }`. Returns a structured inquiry-form draft. Responds `503` when no AI credentials are configured.
- `GET /api/inquiries` - admin-only inquiry list. Set `SETTLESIDE_ADMIN_TOKEN` and send `Authorization: Bearer <token>`.
- `GET /api/admin/snapshot` - provider, catalog, inquiry, and ops statistics.
- `POST /api/admin/inquiry-intelligence` - regenerate the AI plan and admin summary for one inquiry. Body: `{ "id": "ss-..." }`.
- `POST /api/admin/providers` - create or update a provider.
- `POST /api/admin/catalog` - create or update a product or service item.
- `POST /api/admin/catalog-import` - import catalog rows from CSV text.
- `POST /api/admin/catalog-map` - AI-map a provider CSV with arbitrary column names onto the SettleSide catalog format. Body: `{ "csv": "..." }`. Returns the normalized CSV for review before importing.

## Admin Access

Open `/admin` for the catalog operations console. Access to `/api/admin/*` is granted by any of:

1. **Supabase Auth session (primary)** - admins sign in with email and password on the `/admin` page. Create an admin with `node scripts/create-admin.mjs <email> <password>` (the user gets `app_metadata.role = "admin"`, which the server requires). Sessions last one hour; the console re-prompts on expiry.
2. **Static token (break-glass / scripting)** - set `SETTLESIDE_ADMIN_TOKEN` and send `Authorization: Bearer <token>`.
3. **Zero-config development only** - when neither Supabase nor a static token is configured and `NODE_ENV` is not production, admin routes are open. Production never bypasses auth.

## Storage

Storage is dual-backend (`src/lib/settleside.storage.ts`):

- **Supabase (production)**: set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the environment. Create the tables once by running `supabase/schema.sql` in the Supabase SQL editor. Tables are document-style (jsonb) with RLS enabled and no policies, so only the server-side service role can touch them. Seeds are inserted automatically on first read of an empty database.
- **Local JSON (zero-config default)**: without Supabase credentials, data lives under `.settleside/` (or `SETTLESIDE_DATA_DIR`). `GET /api/health` reports which backend is active in its `storage` field.

## AI Assistant

SettleSide uses Claude for two features (`src/lib/settleside.ai.ts`):

1. **Move intake parsing** - the "Describe your move" box on the landing page parses free text into a pre-filled inquiry form.
2. **Move plan generation** - every submitted inquiry gets a personalized, chronologically ordered task plan grounded in the marketplace's services and lead times. When AI is unavailable, inquiries fall back to the rule-based plan and are marked `planSource: "heuristic"` instead of `"ai"`.
3. **Admin inquiry summaries** - the same call produces an internal ops digest per inquiry (headline, urgency, revenue opportunities, next action) shown in the `/admin` console. It is stored on the record but never returned to the customer. Inquiries without one (heuristic fallback or pre-feature records) get a "Generate AI summary" button in the console.
4. **Catalog CSV mapping** - "Map with AI" in the `/admin` CSV import panel. Claude sees only the headers plus a sample of rows and returns a column mapping; deterministic code applies it to the whole file (values are copied verbatim, never AI-rewritten). The normalized CSV lands back in the textarea for review before import.
5. **Supplier intake** - "Add a supplier" in `/admin`. Describe a provider in plain English (name, services, prices, contact) and Claude drafts one provider plus its catalog items (`POST /api/admin/supplier-draft`); you review/edit, choose whether to publish live now, and save (`POST /api/admin/supplier`). Prices are never invented - unstated prices become "Quote required". Saving unpublished stores the provider and items as `active: false`, hidden from the public site until you flip them live.

## Notifications & Rate Limits

- **Inquiry notifications**: set `RESEND_API_KEY` and `SETTLESIDE_NOTIFY_EMAIL` to receive an email per inquiry (with the AI urgency digest when available). `SETTLESIDE_NOTIFY_FROM` overrides the sender once a domain is verified in Resend. Unset = silently skipped; inquiry creation never fails on notification errors.
- **Rate limits** (per IP, in-memory - suits a single long-running server): AI intake parsing 5/min and 20/hour; inquiry submission 3/min and 10/hour; admin login 5 per 5 minutes. Limits are shared between the `/api` routes and the landing page's server functions.

## Automated Pipeline

An inquiry moves itself along without an operator until it needs a decision. Each record carries a `stage`: `new` → `briefed` → `dispatched` → `quoting` → `ready` → `sent`.

1. **Inquiry arrives** - AI plan, provider matches, admin digest, and customer confirmation, all automatic.
2. **Briefs written** - provider request-for-quote messages are generated in the background (`autoPrepareInquiry`), so the customer never waits on them.
3. **Briefs dispatched** - emailed to matching providers that are **published and have an email address**, so unconfirmed prospects are never cold-mailed. Each carries `Reply-To: quotes+<inquiryId>@<SETTLESIDE_QUOTES_DOMAIN>`.
4. **Quotes ingested** - an inbound email service POSTs replies to `POST /api/inbound/quotes` (shared secret in `SETTLESIDE_INBOUND_SECRET`). The endpoint is provider-agnostic: Cloudflare Email Workers, Mailgun/Postmark inbound routes, or a mailbox poller all work. Body: `{ to | inquiryId, from, subject, text }`.
5. **Compared and drafted** - every quote received so far is re-normalised and the customer reply is redrafted automatically.
6. **Sent** - you get a "ready to send" email and approve with one click, or set `SETTLESIDE_AUTO_SEND_REPLY=true` to have it sent automatically.

Steps 3-6 require a Resend-verified sending domain (`SETTLESIDE_NOTIFY_FROM`); without it, outbound mail is skipped rather than bounced and the pipeline stays manual through the move desk.

## Provider Matching

Inquiry-to-catalog matching is deliberately **not** AI: it is a deterministic scoring model in `src/lib/settleside.matching.ts` (instant, free, explainable). Signals: requested help categories (+40), pet relevance (+30), family relevance (+20), provider integration status (up to +15), provider priority (up to +9), item rating (x2), destination city (+6), and checkout actionability (up to +4). Each inquiry record stores `matchInsights` - per-match scores and human-readable reasons - visible through `/api/admin/snapshot`.

- Set `ANTHROPIC_API_KEY` before starting the server to enable it. Without a key the feature degrades gracefully: the endpoint returns `503 not-configured` and the manual form keeps working.
- `SETTLESIDE_AI_MODEL` overrides the model (default `claude-opus-4-8`).

## Deployment (Fly.io)

The production build is a standalone Node server: `SETTLESIDE_DEPLOY_TARGET=node npm run build` emits `.output/server/index.mjs` (the Dockerfile does this). Deploy with:

```bash
flyctl launch --no-deploy   # first time only; confirms app name and region from fly.toml
flyctl secrets set ANTHROPIC_API_KEY=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... RESEND_API_KEY=... SETTLESIDE_NOTIFY_EMAIL=...
flyctl deploy
```

Secrets are never baked into the image (`.env` is dockerignored). Set `primary_region` in `fly.toml` to the region closest to the Supabase project.

## Provider Integration Roadmap

The backend currently uses provider-shaped seed data so the frontend can run end to end. Next production steps are:

1. Replace JSON persistence with Supabase/Postgres.
2. Confirm affiliate/API access for retailers, telcos, movers, cleaning, handyman, insurance, and storage partners.
3. Normalize provider capabilities into catalog, quote, booking, payment, and status-tracking adapters.
4. Add authentication for customer dashboards and provider/admin workflows.
