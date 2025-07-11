"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { FileText } from "lucide-react";

interface DocumentRow {
  id: string;
  title: string;
  filename: string;
  storage_path: string;
  uploaded_at: string;
  doc_type: string;
  tags: string[] | null;
}

interface Props {
  tenantSlug: string;
}

export default function DocumentStagingPanel({ tenantSlug }: Props) {
  const supabase = createClient();
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("documents")
        .select(
          "id, title, filename, storage_path, uploaded_at, doc_type, tags"
        )
        .eq("is_published", false)
        .order("uploaded_at", { ascending: false });

      if (error) {
        console.error("Error fetching documents:", error.message);
        setDocuments([]);
      } else {
        setDocuments(data || []);
      }

      setLoading(false);
    };

    fetchDocuments();
  }, [tenantSlug]);

  const handleAnalyze = async (documentId: string, fileName: string) => {
    setAnalyzingId(documentId);

    try {
      const res = await fetch("/api/analyze-document", {
        method: "POST",
        body: JSON.stringify({
          tenantSlug,
          fileName,
          documentId,
        }),
        headers: { "Content-Type": "application/json" },
      });

      const result = await res.json();

      if (!res.ok) {
        console.error("❌ Analyze failed:", result.error);
        alert(`Error: ${result.error}`);
      } else {
        console.log("✅ Metadata updated:", result.metadata);
        // Optionally re-fetch the list
        const updatedDocs = documents.map((doc) =>
          doc.id === documentId
            ? {
                ...doc,
                title: result.metadata.title || doc.title,
                doc_type: result.metadata.doc_type || doc.doc_type,
                tags: result.metadata.tags || doc.tags,
              }
            : doc
        );
        setDocuments(updatedDocs);
      }
    } catch (err) {
      console.error("Unexpected error analyzing metadata:", err);
      alert("An unexpected error occurred.");
    }

    setAnalyzingId(null);
  };

  if (loading) {
    return (
      <p className="text-sm text-gray-500 text-center">
        Loading unpublished documents…
      </p>
    );
  }

  if (documents.length === 0) {
    return (
      <p className="text-sm text-gray-600 text-center mt-4">
        No unpublished documents found.
      </p>
    );
  }

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold mb-4">Unpublished Documents</h2>
      <ul className="space-y-3">
        {documents.map((doc) => (
          <li
            key={doc.id}
            className="border p-4 rounded shadow-sm bg-white flex items-start justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <FileText className="text-gray-400 w-4 h-4" />
                <span className="font-medium text-gray-900">
                  {doc.title || doc.filename}
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                <br />
                Type: {doc.doc_type || "unspecified"}
                {doc.tags?.length ? (
                  <>
                    <br />
                    Tags: {doc.tags.join(", ")}
                  </>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col items-end justify-between gap-2">
              <button
                onClick={() => handleAnalyze(doc.id, doc.filename)}
                className="text-sm text-purple-600 hover:underline"
                disabled={analyzingId === doc.id}
              >
                {analyzingId === doc.id ? "Analyzing…" : "Analyze Metadata"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
