import Anthropic from "@anthropic-ai/sdk";
import type { PageContent } from "./fetchPageContent";

export type ContentType = "recipe" | "activity";

export interface Detail {
  label: string;
  value: string;
}

export interface ContentExtraction {
  found: boolean;
  contentType: ContentType | null;
  title: string;
  summary: string;
  details: Detail[];
  steps: string[];
  notes: string;
}

const CONTENT_SCHEMA = {
  type: "object",
  properties: {
    found_content: {
      type: "boolean",
      description: "True if this page contains either a cooking recipe or a describable activity/place to go do.",
    },
    content_type: {
      type: "string",
      enum: ["recipe", "activity", "none"],
      description:
        "'recipe' for cooking recipes. 'activity' for things to do — a restaurant, hike, travel spot, day trip, class, or local event. 'none' if found_content is false.",
    },
    title: {
      type: "string",
      description: "The recipe or activity's name/title. Empty string if nothing was found.",
    },
    summary: {
      type: "string",
      description:
        "One or two plain-language sentences describing what this is and why someone saved it. Empty string if nothing was found.",
    },
    details: {
      type: "array",
      description:
        "Key facts as label/value pairs. For a recipe: each ingredient, with label = quantity (e.g. '2 cups') and value = the ingredient name. For an activity: practical facts like Location, Cost, Best time to go, What to bring, Hours, or How to book — label is the fact's name, value is the answer. Only include facts actually present or clearly implied on the page.",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          value: { type: "string" },
        },
        required: ["label", "value"],
        additionalProperties: false,
      },
    },
    steps: {
      type: "array",
      description:
        "Ordered steps to actually complete this. For a recipe: cooking instructions. For an activity: concrete steps to go do it (e.g. how to reserve, what order to do things, tips for the day of).",
      items: { type: "string" },
    },
    notes: {
      type: "string",
      description:
        "If found_content is false, a short plain-language explanation of what this page contains instead. Empty string otherwise.",
    },
  },
  required: ["found_content", "content_type", "title", "summary", "details", "steps", "notes"],
  additionalProperties: false,
} as const;

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

export async function extractContent(page: PageContent): Promise<ContentExtraction> {
  const response = await getClient().messages.create({
    model: "claude-opus-5",
    max_tokens: 4096,
    output_config: {
      format: { type: "json_schema", schema: CONTENT_SCHEMA },
    },
    system: [
      "You turn a saved social media post or blog page into an actionable plan.",
      "The page is either a cooking recipe, or an 'activity' — something to go do, like a restaurant, hike, travel spot, day trip, class, or local event.",
      "Read the page content (which may include a lot of unrelated navigation, ads, or comments mixed in), decide which type it is, and extract it into the requested structure.",
      "If it's a social media caption, the details might be informally written in the caption text itself — do your best to parse structured facts and steps out of prose.",
      "For an activity, 'steps' means concrete actions to actually go do it (e.g. how to book, what to bring, best order of operations) — not generic advice.",
      "If the page is genuinely neither a recipe nor a describable activity, set found_content to false, content_type to 'none', and briefly explain what the page is instead.",
    ].join(" "),
    messages: [
      {
        role: "user",
        content: [
          `Page title: ${page.title || "(none)"}`,
          `Page description: ${page.description || "(none)"}`,
          "",
          "Page content:",
          page.text || "(no readable text found)",
        ].join("\n"),
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude did not return any content.");
  }

  const parsed = JSON.parse(textBlock.text) as {
    found_content: boolean;
    content_type: ContentType | "none";
    title: string;
    summary: string;
    details: Detail[];
    steps: string[];
    notes: string;
  };

  return {
    found: parsed.found_content,
    contentType: parsed.content_type === "none" ? null : parsed.content_type,
    title: parsed.title,
    summary: parsed.summary,
    details: parsed.details,
    steps: parsed.steps,
    notes: parsed.notes,
  };
}
