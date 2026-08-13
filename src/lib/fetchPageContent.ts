const MAX_TEXT_LENGTH = 60_000;

export interface PageContent {
  title: string;
  description: string;
  text: string;
}

/**
 * Downloads a URL and pulls out plain text so it can be handed to Claude.
 * This is intentionally simple (regex-based) rather than a full HTML parser,
 * since Claude only needs readable text, not a DOM.
 */
export async function fetchPageContent(url: string): Promise<PageContent> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  let html: string;
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        // A browser-like user agent avoids some basic bot-blocking.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(
        `The page responded with an error (HTTP ${response.status}). It may be private, deleted, or blocking automated requests.`,
      );
    }

    html = await response.text();
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Timed out trying to load that page. Please try again or use a different link.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  const title = matchMeta(html, "og:title") || matchTag(html, "title") || "";
  const description = matchMeta(html, "og:description") || matchMeta(html, "description") || "";

  const text = extractReadableText(html);

  return { title, description, text: text.slice(0, MAX_TEXT_LENGTH) };
}

function matchMeta(html: string, name: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${escapeRegex(name)}["'][^>]+content=["']([^"']*)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escapeRegex(name)}["']`,
      "i",
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeHtmlEntities(match[1]);
  }
  return null;
}

function matchTag(html: string, tag: string): string | null {
  const match = html.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i"));
  return match ? decodeHtmlEntities(match[1].trim()) : null;
}

function extractReadableText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6])\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .split("\n")
    .map((line) => decodeHtmlEntities(line).replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
