import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { tenantSlug, fileName, documentId } = await req.json();

  if (!tenantSlug || !fileName || !documentId) {
    return NextResponse.json(
      { error: "Missing required parameters." },
      { status: 400 }
    );
  }

  const supabase = createClient();

  // 1. Get a signed URL for the uploaded file
  const { data: signedUrlData, error: urlError } = await supabase.storage
    .from(`${tenantSlug}-uploads`)
    .createSignedUrl(fileName, 60 * 5);

  if (urlError || !signedUrlData?.signedUrl) {
    console.error("Failed to generate signed URL:", urlError);
    return NextResponse.json(
      { error: "Failed to generate signed URL" },
      { status: 400 }
    );
  }

  // 2. Refined prompt with strict rules and guidance
  const prompt = `
You are an HOA assistant AI. Given the contents of the document at the provided URL, return ONLY the following metadata as raw JSON — no explanation, no markdown, no comments:

The JSON object should have the following structure. Respond with ONLY THE JSON object, no other text:
{
  "title": "...",
  "tags": ["...", "..."],
  "doc_type": "...",
  "description": "..."
}

HINT - The following list should tell you what to use for each field. Adhere to the available doc_type values strictly. If you don't know, use "other".
- title: a human-friendly title for the document
- tags: 3–5 relevant tags
- doc_type: one of [bylaws, declaration, articles, rules, budget, financials, minutes, notices, contracts, insurance, other]
- description: a 1-sentence summary

Document URL: ${signedUrlData.signedUrl}
`;

  // 3. Call OpenAI
  const chatResponse = await openai.chat.completions.create({
    model: "gpt-4.1-mini", // ✅ <-- use this model
    temperature: 0.4,
    messages: [{ role: "user", content: prompt }],
  });

  let raw = chatResponse.choices[0]?.message?.content ?? "{}";

  // Strip ```json markdown block if present
  if (raw.startsWith("```json")) {
    raw = raw
      .replace(/^```json/, "")
      .replace(/```$/, "")
      .trim();
  }

  let metadata: {
    title?: string;
    tags?: string[];
    doc_type?: string;
    description?: string;
  };

  try {
    metadata = JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse OpenAI response:", raw);
    return NextResponse.json(
      { error: "Failed to parse OpenAI response" },
      { status: 500 }
    );
  }

  // 4. Update metadata in `documents` table
  const { error: updateError } = await supabase
    .from("documents")
    .update({
      title: metadata.title ?? fileName,
      tags: metadata.tags ?? [],
      doc_type: metadata.doc_type ?? "other",
      description: metadata.description ?? "",
      is_analyzed: true,
    })
    .eq("id", documentId);

  if (updateError) {
    console.error("Failed to update document metadata:", updateError.message);
    return NextResponse.json(
      { error: "Failed to update document metadata" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, metadata });
}
