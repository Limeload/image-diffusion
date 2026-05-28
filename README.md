# Pentagram

AI image generation and social sharing — generate images from text prompts, share them with the community, like and comment on posts.

Built with Next.js 15, Modal (SDXL-Turbo on A10G GPU), Supabase, and Clerk.

---

## Features

- **Text-to-image generation** via SDXL-Turbo (4-step inference, ~0.8s on A10G)
- **Social feed** — public posts, infinite scroll, masonry grid
- **Likes & comments** with optimistic UI updates
- **User profiles** with post history
- **Prompt safety** — hardcoded blocklist + optional OpenAI Moderation API
- **Rate limiting** — 5 generations/min per user via Upstash Redis
- **Auth** via Clerk (sign-up, sign-in, webhooks)
- **Image storage** in Supabase Storage with public CDN URLs

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS |
| Auth | Clerk |
| Database | Supabase (PostgreSQL + pgvector) |
| Storage | Supabase Storage |
| GPU inference | Modal — SDXL-Turbo on A10G |
| Rate limiting | Upstash Redis |
| Language | TypeScript |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18.18
- Python ≥ 3.11 (for Modal)
- Accounts: [Supabase](https://supabase.com), [Clerk](https://clerk.com), [Modal](https://modal.com), [Upstash](https://upstash.com)

### 1. Clone and install

```bash
git clone https://github.com/Limeload/image-diffusion.git
cd image-diffusion
npm install
```

### 2. Set up environment variables

Copy `.env.local.example` to `.env.local` and fill in your keys:

```bash
cp .env.local.example .env.local
```

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk → API Keys |
| `CLERK_SECRET_KEY` | Clerk → API Keys |
| `CLERK_WEBHOOK_SECRET` | Clerk → Webhooks → signing secret |
| `MODAL_ENDPOINT_URL` | Output of `modal deploy modal_app/generate.py` |
| `UPSTASH_REDIS_REST_URL` | Upstash → your database → REST API |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash → your database → REST API |
| `OPENAI_API_KEY` | Optional — enables LLM prompt moderation |

### 3. Set up the database

Run the schema in the Supabase SQL editor:

```bash
# Paste contents of supabase/schema.sql into Supabase SQL editor
# Then paste supabase/storage.sql for Storage bucket policies
```

Or using the Supabase CLI:

```bash
supabase db push
```

### 4. Deploy the Modal backend

```bash
pip install modal
modal setup          # authenticate (opens browser)
modal run modal_app/hello_gpu.py   # verify GPU access
modal deploy modal_app/generate.py # copy the endpoint URL → MODAL_ENDPOINT_URL
```

### 5. Configure Clerk webhook

In the Clerk dashboard → **Webhooks** → add endpoint:
```
https://your-domain.com/api/webhooks/clerk
```
Subscribe to `user.created` and `user.updated` events. Copy the signing secret to `CLERK_WEBHOOK_SECRET`.

For local development, expose your server with:
```bash
npx localtunnel --port 3000
```

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "add your feature"`
4. Push and open a PR: `git push origin feature/your-feature`

---

## License

MIT — see [LICENSE](LICENSE) for details.
