// app/api/analyze-document/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { tenantSlug, fileName, documentId } = await req.json();
  const supabase = createClient();

  // 1. Generate signed URL
  const { data: signedUrlData, error: urlError } = await supabase.storage
    .from(`${tenantSlug}-uploads`)
    .createSignedUrl(fileName, 60 * 5); // 5 min signed URL

  if (urlError || !signedUrlData?.signedUrl) {
    return NextResponse.json(
      { error: "Failed to generate signed URL" },
      { status: 400 }
    );
  }

  const prompt = `
You are an HOA assistant AI. Given the contents of the document at the provided URL, return ONLY the following metadata as raw JSON — no explanation, no markdown, no comments:

The JSON object should have the following structure.  Respond with ONLY THE JSON object, no other text:
{
  "title": "...",
  "tags": ["...", "..."],
  "doc_type": "...",
  "description": "..."
}

HINT - The following list should tell you what to use for each field.  Adhere to the availabl doc_type values strictly.  If you don't know, use "other".
- title: a human-friendly title for the document
- tags: 3–5 relevant tags
- doc_type: one of [bylaws, declaration, articles, rules, budget, financials, minutes, notices, contracts, insurance, other]
- description: a 1-sentence summary

Document URL: ${signedUrlData.signedUrl}
`;

  console.log("🔍 Analyzing document with prompt:", prompt);

  // 2. Send to OpenAI
  const aiResponse = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
  });

  let responseText = aiResponse.choices[0]?.message?.content ?? "{}";

  // 🧼 Clean Markdown-style code block
  if (responseText.startsWith("```json")) {
    responseText = responseText
      .replace(/^```json/, "")
      .replace(/```$/, "")
      .trim();
  }

  let metadata;
  try {
    console.log("🧠 OpenAI response:", responseText);
    metadata = JSON.parse(responseText);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse OpenAI response" },
      { status: 500 }
    );
  }

  // 3. Update documents table
  const { error: updateError } = await supabase
    .from("documents")
    .update({
      title: metadata.title ?? fileName,
      tags: metadata.tags ?? [],
      doc_type: metadata.doc_type ?? "other",
      description: metadata.description ?? "",
    })
    .eq("id", documentId);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update metadata" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, metadata });
}
