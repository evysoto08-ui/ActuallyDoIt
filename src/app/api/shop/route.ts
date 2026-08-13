import { NextRequest, NextResponse } from "next/server";
import { findClothing, type BodyInfo } from "@/lib/findClothing";

// Web search can take a while; ask Vercel for the longest duration available
// on the Hobby plan so this route doesn't get cut off mid-search.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { request: shoppingRequest, height, weight, bodyShape, fitPreference } = body as Record<string, unknown>;

  const requestText = typeof shoppingRequest === "string" ? shoppingRequest.trim() : "";

  const bodyInfo: BodyInfo = {
    height: typeof height === "string" ? height.trim() : "",
    weight: typeof weight === "string" ? weight.trim() : "",
    bodyShape: typeof bodyShape === "string" ? bodyShape.trim() : "",
    fitPreference: typeof fitPreference === "string" ? fitPreference.trim() : "",
  };

  // The request text is optional (leave it blank for general suggestions), but
  // there needs to be *something* to go on — at least a specific item, or some
  // body info to build general suggestions around.
  if (!requestText && !bodyInfo.height && !bodyInfo.weight && !bodyInfo.bodyShape) {
    return NextResponse.json(
      { error: "Please describe what you're shopping for, or fill in your height/weight/body shape." },
      { status: 400 },
    );
  }

  try {
    const result = await findClothing(bodyInfo, requestText);
    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
