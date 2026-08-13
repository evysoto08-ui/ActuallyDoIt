import Anthropic from "@anthropic-ai/sdk";
import type { PageContent } from "./fetchPageContent";

export interface Ingredient {
  quantity: string;
  item: string;
}

export interface RecipeExtraction {
  foundRecipe: boolean;
  title: string;
  ingredients: Ingredient[];
  steps: string[];
  notes: string;
}

const RECIPE_SCHEMA = {
  type: "object",
  properties: {
    found_recipe: {
      type: "boolean",
      description: "True if this page actually contains a cooking recipe.",
    },
    title: {
      type: "string",
      description: "The recipe's title. Empty string if no recipe was found.",
    },
    ingredients: {
      type: "array",
      description: "Every ingredient with its quantity, in the order listed on the page.",
      items: {
        type: "object",
        properties: {
          quantity: {
            type: "string",
            description:
              "The amount and unit as written, e.g. '2 cups' or '1 tbsp'. Empty string if no amount was given.",
          },
          item: {
            type: "string",
            description: "The ingredient name, e.g. 'all-purpose flour'.",
          },
        },
        required: ["quantity", "item"],
        additionalProperties: false,
      },
    },
    steps: {
      type: "array",
      description: "Step-by-step cooking instructions, in order.",
      items: { type: "string" },
    },
    notes: {
      type: "string",
      description:
        "If found_recipe is false, a short plain-language explanation of what this page contains instead. Empty string otherwise.",
    },
  },
  required: ["found_recipe", "title", "ingredients", "steps", "notes"],
  additionalProperties: false,
} as const;

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

export async function extractRecipe(page: PageContent): Promise<RecipeExtraction> {
  const response = await getClient().messages.create({
    model: "claude-opus-5",
    max_tokens: 4096,
    output_config: {
      format: { type: "json_schema", schema: RECIPE_SCHEMA },
    },
    system:
      "You extract cooking recipes from raw web page text (which may include a lot of unrelated navigation, ads, or comments mixed in). Find the actual recipe content, ignore everything else, and return it in the requested structure. If the page is a social media caption, the recipe details might be informally written in the caption text itself — do your best to parse ingredients and steps out of prose. If there is genuinely no recipe on this page, set found_recipe to false and briefly explain what the page is instead.",
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
    found_recipe: boolean;
    title: string;
    ingredients: Ingredient[];
    steps: string[];
    notes: string;
  };

  return {
    foundRecipe: parsed.found_recipe,
    title: parsed.title,
    ingredients: parsed.ingredients,
    steps: parsed.steps,
    notes: parsed.notes,
  };
}
