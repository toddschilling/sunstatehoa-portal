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

  // Step 1: Get a signed URL for the uploaded file
  const { data: signedUrlData, error: urlError } = await supabase.storage
    .from(`${tenantSlug}-uploads`)
    .createSignedUrl(fileName, 60 * 5);

  if (urlError || !signedUrlData?.signedUrl) {
    console.error("❌ Failed to generate signed URL:", urlError);
    return NextResponse.json(
      { error: "Failed to generate signed URL" },
      { status: 400 }
    );
  }

  // Step 2: Ask OpenAI to analyze the document
  const prompt = `
You are an HOA assistant AI. Given the contents of the document at the provided URL, return ONLY the following metadata as raw JSON — no explanation, no markdown, no comments:

Respond with ONLY the JSON object, no other text:
{
  "title": "...",
  "doc_type": "...",
  "description": "...",
  "doc_year": 2025
}

Notes:
- title: a short, human-readable title (e.g. "2025 Reserve Study", "Board Meeting Minutes – March 2024")
- doc_type: one of the following HOA categories:
  - bylaws: community bylaws and governance rules
  - declaration: covenants, conditions, and restrictions (CC&Rs)
  - articles: articles of incorporation or legal filings
  - rules: rules and regulations (e.g., pool rules, parking)
  - budget: annual or proposed budget summaries
  - financials: financial statements, audits, reserve studies, balance sheets, or spending reports
  - minutes: meeting minutes from board or committee meetings
  - notices: public notices, violation letters, announcements, elections
  - contracts: signed service agreements or proposals
  - insurance: proof of insurance or related policies
  - other: only use if the document does not fit any of the above categories

Examples:
- A document titled "2025 Reserve Study" or "Reserve Funding Analysis" → doc_type = "financials"
- A document titled "2025 Budget Overview" → doc_type = "budget"
- A document with board decisions from a meeting → doc_type = "minutes"

- description: a single-sentence summary of the document's purpose or contents
- doc_year: the year this document pertains to (typically found in the title or first page); return a 4-digit number or null if not clearly stated

Document URL: ${signedUrlData.signedUrl}
`;

  const chatResponse = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.4,
    messages: [{ role: "user", content: prompt }],
  });

  let raw = chatResponse.choices[0]?.message?.content ?? "{}";

  // Clean code fences if present
  if (raw.startsWith("```json")) {
    raw = raw
      .replace(/^```json/, "")
      .replace(/```$/, "")
      .trim();
  }

  let metadata: {
    title?: string;
    doc_type?: string;
    description?: string;
    doc_year?: number;
  };

  try {
    metadata = JSON.parse(raw);
  } catch (e) {
    console.error("❌ Failed to parse OpenAI response:", raw);
    return NextResponse.json(
      { error: "Failed to parse OpenAI response" },
      { status: 500 }
    );
  }

  // Step 3: Update the metadata in Supabase
  const { error: updateError } = await supabase
    .from("documents")
    .update({
      title: metadata.title ?? fileName,
      doc_type: metadata.doc_type ?? "other",
      description: metadata.description ?? "",
      document_year: metadata.doc_year ?? null,
      is_analyzed: true,
    })
    .eq("id", documentId);

  if (updateError) {
    console.error(
      "❌ Failed to update document metadata:",
      updateError.message
    );
    return NextResponse.json(
      { error: "Failed to update document metadata" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, metadata });
}
