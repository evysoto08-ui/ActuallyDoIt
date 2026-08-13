# ActuallyDoIt

Paste a link to a saved post (a recipe blog, a travel/things-to-do post, or a public Instagram post), and this app fetches the page, asks Claude to figure out what it is and pull out the useful parts, and shows it as a clean, actionable card.

Two kinds of content are supported right now:

- **Recipes** — title, ingredients, and steps.
- **Activities** — things to do (a hike, restaurant, day trip, class, local event). Shows key facts (location, cost, best time, how to book) plus concrete steps to actually go do it.

This is still an early, bare-bones version: one page, one link at a time, nothing saved.

## Getting started

1. Copy `.env.local.example` to `.env.local` and fill in your Anthropic API key (get one at [console.anthropic.com](https://console.anthropic.com/settings/keys)):

   ```bash
   cp .env.local.example .env.local
   ```

2. Install dependencies and start the dev server:

   ```bash
   npm install
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000), paste a URL, and click "Extract".

## How it works

- `src/app/page.tsx` — the input page and result card UI.
- `src/app/api/extract/route.ts` — the server endpoint the page calls.
- `src/lib/fetchPageContent.ts` — downloads the URL and strips it down to readable text.
- `src/lib/extractContent.ts` — sends that text to Claude, which decides whether it's a recipe or an activity and returns structured JSON (title, summary, key details, steps).

## Known limitations (v1)

- **Instagram posts** are hit-or-miss: Instagram hides most content behind login/JavaScript, so only what's available in the page's public preview data can be read. Blog posts work much more reliably.
- No login, no saved history — each link is a one-off lookup.
- Only recognizes recipes and activities so far — book/movie recs and DIY projects aren't handled yet.
