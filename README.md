# ActuallyDoIt

Turns saved posts into things you actually do, and helps you shop for what you need.

The app has two sections (see the nav at the top):

### Saved posts

Paste a link to a saved post (a recipe blog, a travel/things-to-do post, or a public Instagram post), and the app fetches the page, asks Claude to figure out what it is and pull out the useful parts, and shows it as a clean, actionable card.

- **Recipes** — title, ingredients, and steps.
- **Activities** — things to do (a hike, restaurant, day trip, class, local event). Shows key facts (location, cost, best time, how to book) plus concrete steps to actually go do it.

### Shop for me

Enter your height, body shape, and fit preference (saved in your browser so you don't retype it), then either describe what you're shopping for or leave that blank for general suggestions, and Claude searches the real web for currently available clothing items that suit your shape, with links and an explanation of why each one fits. Nothing is ever purchased automatically — it's a shortlist for you to review and buy yourself.

This is still an early, bare-bones version: no login, nothing saved to a database.

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

3. Open [http://localhost:3000](http://localhost:3000).

## How it works

- `src/app/page.tsx` — the "Saved posts" input page and result card UI.
- `src/app/api/extract/route.ts` — the server endpoint the saved-posts page calls.
- `src/lib/fetchPageContent.ts` — downloads a URL and strips it down to readable text.
- `src/lib/extractContent.ts` — sends that text to Claude, which decides whether it's a recipe or an activity and returns structured JSON (title, summary, key details, steps).
- `src/app/shop/page.tsx` — the "Shop for me" form and results UI.
- `src/app/api/shop/route.ts` — the server endpoint the shop page calls.
- `src/lib/findClothing.ts` — sends body info + the shopping request to Claude with web search enabled, and gets back structured JSON (items with links/prices/fit reasoning, plus general styling notes).
- `src/components/NavBar.tsx` — the top navigation between the two sections.

## Known limitations (v1)

- **Instagram posts** are hit-or-miss: Instagram hides most content behind login/JavaScript, so only what's available in the page's public preview data can be read. Blog posts work much more reliably.
- **"Shop for me" searches can take up to a minute** — it's doing real web research each time, not a cached lookup, so results (and prices especially) aren't always fully verified. Claude is instructed to say so honestly rather than guess.
- No login, no saved history — each lookup is a one-off.
- Saved-posts recognition only covers recipes and activities so far — book/movie recs and DIY projects aren't handled yet.
