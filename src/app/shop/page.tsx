"use client";

import { useEffect, useState, FormEvent } from "react";

const BODY_INFO_STORAGE_KEY = "actuallydoit.bodyInfo";

const BODY_SHAPES = [
  "Not sure / skip",
  "Pear",
  "Hourglass",
  "Rectangle / straight",
  "Apple / round",
  "Athletic / inverted triangle",
];

const FIT_PREFERENCES = ["No preference", "Loose / relaxed", "Fitted / tailored"];

interface ClothingItem {
  name: string;
  brand: string;
  price: string;
  url: string;
  whyItFits: string;
}

interface ShopResult {
  found: boolean;
  items: ClothingItem[];
  stylingNotes: string;
  notes: string;
}

export default function ShopPage() {
  const [height, setHeight] = useState("");
  const [bodyShape, setBodyShape] = useState(BODY_SHAPES[0]);
  const [fitPreference, setFitPreference] = useState(FIT_PREFERENCES[0]);
  const [request, setRequest] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ShopResult | null>(null);

  // Load saved body info from this browser, if any, so you don't retype it every time.
  // This is a one-time hydration from an external store (localStorage) right after
  // mount, not state derived from props/other state, so it belongs in an effect.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(BODY_INFO_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as {
        height?: string;
        bodyShape?: string;
        fitPreference?: string;
      };
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage on mount
      setHeight(parsed.height ?? "");
      setBodyShape(parsed.bodyShape || BODY_SHAPES[0]);
      setFitPreference(parsed.fitPreference || FIT_PREFERENCES[0]);
    } catch {
      // Ignore malformed/unavailable localStorage — not worth surfacing to the user.
    }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!request.trim() || loading) return;

    try {
      localStorage.setItem(
        BODY_INFO_STORAGE_KEY,
        JSON.stringify({ height, bodyShape, fitPreference }),
      );
    } catch {
      // Non-critical — proceed even if saving fails.
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          height,
          bodyShape: bodyShape === BODY_SHAPES[0] ? "" : bodyShape,
          fitPreference: fitPreference === FIT_PREFERENCES[0] ? "" : fitPreference,
          request: request.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-12 sm:py-16 bg-neutral-50">
      <div className="w-full max-w-2xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
            Shop for me
          </h1>
          <p className="mt-2 text-neutral-600">
            Tell me a bit about your body and what you need — I&apos;ll find real items that fit.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700" htmlFor="height">
                Height <span className="text-neutral-400">(optional)</span>
              </label>
              <input
                id="height"
                type="text"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder={'e.g. 5\'6"'}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700" htmlFor="bodyShape">
                Body shape <span className="text-neutral-400">(optional)</span>
              </label>
              <select
                id="bodyShape"
                value={bodyShape}
                onChange={(e) => setBodyShape(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                {BODY_SHAPES.map((shape) => (
                  <option key={shape} value={shape}>
                    {shape}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700" htmlFor="fitPreference">
                Fit preference <span className="text-neutral-400">(optional)</span>
              </label>
              <select
                id="fitPreference"
                value={fitPreference}
                onChange={(e) => setFitPreference(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                {FIT_PREFERENCES.map((pref) => (
                  <option key={pref} value={pref}>
                    {pref}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-neutral-700" htmlFor="request">
              What are you shopping for?
            </label>
            <textarea
              id="request"
              required
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder="e.g. black work pants, a dress for a summer wedding, a warm winter coat"
              rows={3}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-neutral-900 px-6 py-3 font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {loading ? "Searching…" : "Find items"}
          </button>

          <p className="mt-3 text-xs text-neutral-400">
            Your height, shape, and fit preference are saved only in this browser, so you don&apos;t
            need to retype them next time. Nothing is ever purchased automatically.
          </p>
        </form>

        {loading && (
          <p className="mt-6 text-center text-sm text-neutral-500">
            Searching the web for real items and checking them against your shape&hellip; this can
            take up to a minute.
          </p>
        )}

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && result.found && <ResultsCard result={result} />}

        {result && !result.found && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            I couldn&apos;t find anything matching that.
            {result.notes ? ` ${result.notes}` : ""}
          </div>
        )}
      </div>
    </main>
  );
}

function ResultsCard({ result }: { result: ShopResult }) {
  return (
    <section className="mt-8 space-y-4">
      {result.stylingNotes && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 text-sm text-neutral-700 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Styling notes
          </h3>
          <p className="mt-2">{result.stylingNotes}</p>
        </div>
      )}

      {result.items.map((item, i) => (
        <article
          key={i}
          className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold text-neutral-900">{item.name}</h2>
            <span className="text-sm font-medium text-neutral-600">{item.price}</span>
          </div>
          <p className="text-sm text-neutral-500">{item.brand}</p>
          <p className="mt-3 text-neutral-700">{item.whyItFits}</p>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            View item
          </a>
        </article>
      ))}
    </section>
  );
}
