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

  const { request: shoppingRequest, height, bodyShape, fitPreference } = body as Record<string, unknown>;

  if (typeof shoppingRequest !== "string" || shoppingRequest.trim().length === 0) {
    return NextResponse.json(
      { error: "Please describe what you're shopping for." },
      { status: 400 },
    );
  }

  const bodyInfo: BodyInfo = {
    height: typeof height === "string" ? height.trim() : "",
    bodyShape: typeof bodyShape === "string" ? bodyShape.trim() : "",
    fitPreference: typeof fitPreference === "string" ? fitPreference.trim() : "",
  };

  try {
    const result = await findClothing(bodyInfo, shoppingRequest.trim());
    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
