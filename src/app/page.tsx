"use client";

import { useState, FormEvent } from "react";

interface Ingredient {
  quantity: string;
  item: string;
}

interface RecipeExtraction {
  foundRecipe: boolean;
  title: string;
  ingredients: Ingredient[];
  steps: string[];
  notes: string;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<RecipeExtraction | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!url.trim() || loading) return;

    setLoading(true);
    setError(null);
    setRecipe(null);

    try {
      const res = await fetch("/api/extract-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }
      setRecipe(data.recipe);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-16 sm:py-24 bg-neutral-50">
      <div className="w-full max-w-2xl">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
            ActuallyDoIt
          </h1>
          <p className="mt-2 text-neutral-600">
            Paste a recipe link. Get an actual, usable recipe.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/some-recipe"
            className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-neutral-900 px-6 py-3 font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Extracting…" : "Extract recipe"}
          </button>
        </form>

        {loading && (
          <p className="mt-6 text-center text-sm text-neutral-500">
            Fetching the page and asking Claude to read it&hellip; this can take a few seconds.
          </p>
        )}

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {recipe && recipe.foundRecipe && <RecipeCard recipe={recipe} />}

        {recipe && !recipe.foundRecipe && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            I couldn&apos;t find a recipe on that page.
            {recipe.notes ? ` ${recipe.notes}` : ""}
          </div>
        )}
      </div>
    </main>
  );
}

function RecipeCard({ recipe }: { recipe: RecipeExtraction }) {
  return (
    <article className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-semibold text-neutral-900">{recipe.title}</h2>

      {recipe.ingredients.length > 0 && (
        <section className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Ingredients
          </h3>
          <ul className="mt-3 space-y-2">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex gap-3 text-neutral-800">
                <span className="min-w-24 shrink-0 font-medium text-neutral-600">
                  {ing.quantity}
                </span>
                <span>{ing.item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recipe.steps.length > 0 && (
        <section className="mt-8">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Steps
          </h3>
          <ol className="mt-3 space-y-4">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-neutral-800">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </article>
  );
}
