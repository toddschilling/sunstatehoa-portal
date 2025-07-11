"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { FileText, Trash2, Archive, Loader2 } from "lucide-react";

interface DocumentRow {
  id: string;
  title: string;
  filename: string;
  storage_path: string;
  uploaded_at: string;
  doc_type: string;
  tags: string[] | null;
  is_archived: boolean;
  is_analyzed: boolean;
}

interface Props {
  tenantSlug: string;
  version: number;
}

export default function DocumentStagingPanel({ tenantSlug, version }: Props) {
  const supabase = createClient();
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("documents")
        .select(
          "id, title, filename, storage_path, uploaded_at, doc_type, tags, is_archived, is_analyzed"
        )
        .eq("is_published", false)
        .eq("is_archived", false)
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
  }, [tenantSlug, version]);

  const handleArchive = async (documentId: string) => {
    const { error } = await supabase
      .from("documents")
      .update({ is_archived: true })
      .eq("id", documentId);

    if (error) {
      console.error("❌ Failed to archive document:", error.message);
      alert("Failed to archive document.");
      return;
    }

    setDocuments((docs) => docs.filter((doc) => doc.id !== documentId));
  };

  const handleDelete = async (documentId: string, storagePath: string) => {
    const confirmed = confirm(
      "Are you sure you want to permanently delete this document?"
    );
    if (!confirmed) return;

    const { error: storageError } = await supabase.storage
      .from(`${tenantSlug}-uploads`)
      .remove([storagePath]);

    if (storageError) {
      console.error(
        "❌ Failed to delete file from storage:",
        storageError.message
      );
      alert("Failed to delete file from storage.");
      return;
    }

    const { error: dbError } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId);

    if (dbError) {
      console.error("❌ Failed to delete metadata row:", dbError.message);
      alert("Deleted file but failed to delete metadata row.");
      return;
    }

    setDocuments((docs) => docs.filter((doc) => doc.id !== documentId));
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
        {documents.map((doc) => {
          const isPending = !doc.is_analyzed;

          return (
            <li
              key={doc.id}
              className={`border p-4 rounded shadow-sm bg-white grid grid-cols-1 md:grid-cols-3 gap-4 items-start ${
                isPending ? "opacity-60 pointer-events-none" : ""
              }`}
            >
              {/* Column 1: File name */}
              <div className="flex items-start gap-2">
                <FileText className="text-gray-400 w-4 h-4 mt-1" />
                <div className="truncate text-sm text-gray-900 font-medium">
                  <span
                    title={doc.title || doc.filename}
                    className="truncate block max-w-[250px]"
                  >
                    {doc.title || doc.filename}
                  </span>
                </div>
              </div>

              {/* Column 2: Metadata or analyzing message */}
              <div className="text-sm text-gray-600">
                {isPending ? (
                  <span className="italic text-gray-500 flex items-center gap-1">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Reviewing and categorizing automatically…
                  </span>
                ) : (
                  <>
                    Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                    <br />
                    Type: {doc.doc_type || "unspecified"}
                    {doc.tags?.length ? (
                      <>
                        <br />
                        Tags: {doc.tags.join(", ")}
                      </>
                    ) : null}
                  </>
                )}
              </div>

              {/* Column 3: Actions */}
              <div className="flex flex-col items-start md:items-end gap-2">
                <button
                  onClick={() => handleArchive(doc.id)}
                  className="text-sm text-gray-700 hover:underline flex items-center gap-1"
                >
                  <Archive className="w-4 h-4" /> Archive
                </button>

                <button
                  onClick={() => handleDelete(doc.id, doc.storage_path)}
                  className="text-sm text-red-600 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
