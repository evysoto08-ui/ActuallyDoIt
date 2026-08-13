import Anthropic from "@anthropic-ai/sdk";

export interface BodyInfo {
  height: string;
  weight: string;
  bodyShape: string;
  fitPreference: string;
}

export interface ClothingItem {
  name: string;
  brand: string;
  price: string;
  url: string;
  whyItFits: string;
}

export interface ClothingSearchResult {
  found: boolean;
  items: ClothingItem[];
  stylingNotes: string;
  notes: string;
}

const CLOTHING_SCHEMA = {
  type: "object",
  properties: {
    found_items: {
      type: "boolean",
      description: "True if you found at least one real, currently purchasable item that matches the request.",
    },
    items: {
      type: "array",
      description: "Recommended clothing items, best match first. Empty array if found_items is false.",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "The product name as listed by the retailer." },
          brand: { type: "string", description: "The brand or store name." },
          price: {
            type: "string",
            description: "The price as found (e.g. '$59.99'). Use 'Price not listed' if unavailable.",
          },
          url: { type: "string", description: "A direct link to the product page." },
          why_it_fits: {
            type: "string",
            description:
              "One or two sentences on why this item suits the person's body shape and the specific request — grounded in real fit/cut details from the product page, not generic advice.",
          },
        },
        required: ["name", "brand", "price", "url", "why_it_fits"],
        additionalProperties: false,
      },
    },
    styling_notes: {
      type: "string",
      description:
        "A couple of general, plain-language styling tips for this body shape and request (e.g. what necklines, rises, or cuts to look for). Empty string if found_items is false.",
    },
    notes: {
      type: "string",
      description: "If found_items is false, a short explanation of why nothing suitable was found. Empty string otherwise.",
    },
  },
  required: ["found_items", "items", "styling_notes", "notes"],
  additionalProperties: false,
} as const;

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

export async function findClothing(body: BodyInfo, request: string): Promise<ClothingSearchResult> {
  const bodyDescription = [
    body.height && `Height: ${body.height}`,
    body.weight && `Weight: ${body.weight}`,
    body.bodyShape && `Body shape: ${body.bodyShape}`,
    body.fitPreference && `Fit preference: ${body.fitPreference}`,
  ]
    .filter(Boolean)
    .join("\n");

  const hasSpecificRequest = request.trim().length > 0;

  const sizingGuidance =
    " When height and/or weight are given, use them alongside the body shape to suggest a likely starting size from the retailer's own size chart where you can find one, and mention it in the fit reasoning — but always caveat that they should double-check against the specific brand's chart, since sizing varies a lot between retailers.";

  const system = (
    hasSpecificRequest
      ? "You are a personal shopper. Use web search to find real, currently available clothing items that match what the person is shopping for and that suit their body shape well. Only recommend items you actually found via search — never invent products, prices, or links. Prefer items from real, well-known retailers. Explain fit reasoning in terms of real cut/fabric/silhouette details from what you found, not generic platitudes. If search turns up nothing suitable, say so honestly rather than guessing."
      : "You are a personal shopper. The person hasn't asked for a specific item — instead, use web search to put together a small, varied set of real, currently available pieces (e.g. a top, a bottom, and one layering or statement piece) that are well suited to their body shape. Pick genuinely different categories rather than several near-duplicates. Only recommend items you actually found via search — never invent products, prices, or links. Prefer items from real, well-known retailers. Explain fit reasoning in terms of real cut/fabric/silhouette details from what you found, not generic platitudes. If search turns up nothing suitable, say so honestly rather than guessing."
  ) + sizingGuidance;

  const response = await getClient().messages.create({
    model: "claude-opus-5",
    max_tokens: 4096,
    tools: [
      {
        type: "web_search_20260209",
        name: "web_search",
        max_uses: 4,
      },
    ],
    output_config: {
      format: { type: "json_schema", schema: CLOTHING_SCHEMA },
      effort: "medium",
    },
    system,
    messages: [
      {
        role: "user",
        content: [
          "Here's what I know about my body:",
          bodyDescription || "(no details given)",
          "",
          hasSpecificRequest
            ? `What I'm shopping for: ${request}`
            : "What I'm shopping for: no specific item — suggest a few versatile pieces that would suit me.",
        ].join("\n"),
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude did not return any content.");
  }

  const parsed = JSON.parse(textBlock.text) as {
    found_items: boolean;
    items: Array<{
      name: string;
      brand: string;
      price: string;
      url: string;
      why_it_fits: string;
    }>;
    styling_notes: string;
    notes: string;
  };

  return {
    found: parsed.found_items,
    items: parsed.items.map((item) => ({
      name: item.name,
      brand: item.brand,
      price: item.price,
      url: item.url,
      whyItFits: item.why_it_fits,
    })),
    stylingNotes: parsed.styling_notes,
    notes: parsed.notes,
  };
}
