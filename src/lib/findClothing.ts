import Anthropic from "@anthropic-ai/sdk";

export interface BodyInfo {
  height: string;
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
    body.bodyShape && `Body shape: ${body.bodyShape}`,
    body.fitPreference && `Fit preference: ${body.fitPreference}`,
  ]
    .filter(Boolean)
    .join("\n");

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
    system:
      "You are a personal shopper. Use web search to find real, currently available clothing items that match what the person is shopping for and that suit their body shape well. Only recommend items you actually found via search — never invent products, prices, or links. Prefer items from real, well-known retailers. Explain fit reasoning in terms of real cut/fabric/silhouette details from what you found, not generic platitudes. If search turns up nothing suitable, say so honestly rather than guessing.",
    messages: [
      {
        role: "user",
        content: [
          "Here's what I know about my body:",
          bodyDescription || "(no details given)",
          "",
          `What I'm shopping for: ${request}`,
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
