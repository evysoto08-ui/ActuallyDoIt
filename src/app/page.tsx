"use client";

import { useState, FormEvent } from "react";

type ContentType = "recipe" | "activity";

interface Detail {
  label: string;
  value: string;
}

interface ContentExtraction {
  found: boolean;
  contentType: ContentType | null;
  title: string;
  summary: string;
  details: Detail[];
  steps: string[];
  notes: string;
}

const SECTION_LABELS: Record<ContentType, { details: string; steps: string }> = {
  recipe: { details: "Ingredients", steps: "Steps" },
  activity: { details: "Good to know", steps: "How to do it" },
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<ContentExtraction | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!url.trim() || loading) return;

    setLoading(true);
    setError(null);
    setContent(null);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }
      setContent(data.content);
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
            Paste a link to a recipe or something you want to go do. Get an actual plan.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/some-post"
            className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-neutral-900 px-6 py-3 font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Extracting…" : "Extract"}
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

        {content && content.found && content.contentType && (
          <ContentCard content={content} contentType={content.contentType} />
        )}

        {content && !content.found && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            I couldn&apos;t find a recipe or an activity on that page.
            {content.notes ? ` ${content.notes}` : ""}
          </div>
        )}
      </div>
    </main>
  );
}

function ContentCard({
  content,
  contentType,
}: {
  content: ContentExtraction;
  contentType: ContentType;
}) {
  const labels = SECTION_LABELS[contentType];

  return (
    <article className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
      <span className="inline-block rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
        {contentType === "recipe" ? "Recipe" : "Activity"}
      </span>
      <h2 className="mt-3 text-2xl font-semibold text-neutral-900">{content.title}</h2>
      {content.summary && <p className="mt-2 text-neutral-600">{content.summary}</p>}

      {content.details.length > 0 && (
        <section className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {labels.details}
          </h3>
          <ul className="mt-3 space-y-2">
            {content.details.map((detail, i) => (
              <li key={i} className="flex gap-3 text-neutral-800">
                <span className="min-w-28 shrink-0 font-medium text-neutral-600">
                  {detail.label}
                </span>
                <span>{detail.value}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {content.steps.length > 0 && (
        <section className="mt-8">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {labels.steps}
          </h3>
          <ol className="mt-3 space-y-4">
            {content.steps.map((step, i) => (
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
