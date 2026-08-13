import { NextRequest, NextResponse } from "next/server";
import { fetchPageContent } from "@/lib/fetchPageContent";
import { extractContent } from "@/lib/extractContent";

export async function POST(request: NextRequest) {
  let url: unknown;
  try {
    ({ url } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof url !== "string" || url.trim().length === 0) {
    return NextResponse.json({ error: "Please provide a URL." }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url.trim());
  } catch {
    return NextResponse.json({ error: "That doesn't look like a valid URL." }, { status: 400 });
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return NextResponse.json({ error: "Only http and https links are supported." }, { status: 400 });
  }

  try {
    const page = await fetchPageContent(parsedUrl.toString());
    const content = await extractContent(page);
    return NextResponse.json({ content });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
