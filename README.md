# ActuallyDoIt

Paste a link to a recipe (a blog post, or a public Instagram post), and this app fetches the page, asks Claude to pull out the recipe title, ingredients, and steps, and shows it as a clean card.

This is the first, bare-bones version: one page, one link at a time, nothing saved.

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

3. Open [http://localhost:3000](http://localhost:3000), paste a recipe URL, and click "Extract recipe".

## How it works

- `src/app/page.tsx` — the input page and recipe card UI.
- `src/app/api/extract-recipe/route.ts` — the server endpoint the page calls.
- `src/lib/fetchPageContent.ts` — downloads the URL and strips it down to readable text.
- `src/lib/extractRecipe.ts` — sends that text to Claude and asks for structured JSON back (title, ingredients, steps).

## Known limitations (v1)

- **Instagram posts** are hit-or-miss: Instagram hides most content behind login/JavaScript, so only what's available in the page's public preview data can be read. Recipe blogs work much more reliably.
- No login, no saved history — each link is a one-off lookup.
