"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import {
  File,
  FilePdf,
  FileDoc,
  FileXls,
  FileImage,
  FileZip,
  FileAudio,
  FileVideo,
  FileText,
  Trash,
  Spinner,
  Eye,
} from "phosphor-react";
import type { FilterState } from "@/components/FilterBar";

interface DocumentRow {
  id: string;
  tenant_id: string;
  title: string;
  filename: string;
  storage_path: string;
  file_type: string | null;
  uploaded_by: string | null;
  uploaded_at: string | null;
  is_public: boolean;
  description: string | null;
  doc_type:
    | "bylaws"
    | "declaration"
    | "articles"
    | "rules"
    | "budget"
    | "financials"
    | "minutes"
    | "notices"
    | "contracts"
    | "insurance"
    | "other";
  is_published: boolean;
  is_archived: boolean;
  is_analyzed: boolean;
  document_year: number | null;
}

interface Props {
  tenantSlug: string;
  version: number;
  filters: FilterState;
}

function getFileIcon(fileType?: string | null) {
  if (!fileType) {
    return <File size={20} weight="regular" className="text-gray-700" />;
  }

  const type = fileType.toLowerCase();

  if (type.includes("pdf"))
    return <FilePdf size={20} weight="duotone" className="text-gray-700" />;
  if (type.includes("word") || type.includes("doc"))
    return <FileDoc size={20} weight="duotone" className="text-gray-700" />;
  if (type.includes("xls") || type.includes("sheet") || type.includes("csv"))
    return <FileXls size={20} weight="duotone" className="text-gray-700" />;
  if (type.includes("image"))
    return <FileImage size={20} weight="duotone" className="text-gray-700" />;
  if (type.includes("zip") || type.includes("archive"))
    return <FileZip size={20} weight="duotone" className="text-gray-700" />;
  if (type.includes("audio"))
    return <FileAudio size={20} weight="duotone" className="text-gray-700" />;
  if (type.includes("video"))
    return <FileVideo size={20} weight="duotone" className="text-gray-700" />;
  return <FileText size={20} weight="regular" className="text-gray-700" />;
}

export default function DocumentsViewPanel({
  tenantSlug,
  version,
  filters,
}: Props) {
  console.log("🧱 DocumentsViewPanel mounted");

  const supabase = createClient();
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingInProgress, setDeletingInProgress] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    console.log("📥 useEffect triggered");

    /*     const fetchDocuments = async () => {
      setLoading(true);

      let query = supabase
        .from("documents")
        .select("*")
        .eq("tenant_id", tenantSlug)
        .order("uploaded_at", { ascending: false });

      if (filters.published === "true") {
        query = query.eq("is_published", true);
      } else if (filters.published === "false") {
        query = query.eq("is_published", false);
      }

      if (filters.archived === "true") {
        query = query.eq("is_archived", true);
      } else if (filters.archived === "false") {
        query = query.eq("is_archived", false);
      }

      if (filters.year) {
        query = query.eq("document_year", parseInt(filters.year));
      }

      if (filters.docType) {
        query = query.eq("doc_type", filters.docType);
      }

      if (filters.search?.trim()) {
        query = query.ilike("title", `%${filters.search.trim()}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching documents:", error.message);
        setDocuments([]);
      } else {
        const docs = (data || []) as DocumentRow[];
        setDocuments(docs);
        generatePreviewLinks(docs);
      }

      setLoading(false);
    };

    const generatePreviewLinks = async (docs: DocumentRow[]) => {
      const newUrls: Record<string, string> = {};
      for (const doc of docs) {
        const { data } = await supabase.storage
          .from(`${tenantSlug}-uploads`)
          .createSignedUrl(doc.storage_path, 300);
        if (data?.signedUrl) {
          newUrls[doc.id] = data.signedUrl;
        }
      }
      setPreviewUrls(newUrls);
    };

    console.log("📥 DocumentsViewPanel useEffect triggered", {
      tenantSlug,
      version,
      filters,
    });
    fetchDocuments(); */
  }, [tenantSlug, version, filters]);

  const handleDelete = async (documentId: string, storagePath: string) => {
    setDeletingInProgress(true);

    const { error: storageError } = await supabase.storage
      .from(`${tenantSlug}-uploads`)
      .remove([storagePath]);

    if (storageError) {
      alert("Failed to delete file from storage.");
      setDeletingInProgress(false);
      return;
    }

    const { error: dbError } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId);

    if (dbError) {
      alert("Deleted file but failed to delete metadata row.");
      setDeletingInProgress(false);
      return;
    }

    setDocuments((docs) => docs.filter((doc) => doc.id !== documentId));
    setDeletingId(null);
    setDeletingInProgress(false);
  };

  if (loading) {
    return (
      <p className="text-sm text-gray-500 text-center">Loading documents…</p>
    );
  }

  if (documents.length === 0) {
    return (
      <p className="text-sm text-gray-600 text-center mt-4">
        No documents found.
      </p>
    );
  }

  return (
    <div className="mt-10">
      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
        {documents.map((doc) => {
          const isPending = !doc.is_analyzed;
          const isConfirmingDelete = deletingId === doc.id;

          return (
            <div
              key={doc.id}
              className={`border p-4 rounded shadow-sm bg-white w-full flex flex-col justify-between h-auto ${
                isPending ? "opacity-60 pointer-events-none" : ""
              }`}
            >
              <div className="flex items-start gap-2 mb-2">
                {getFileIcon(doc.file_type)}
                <div className="flex flex-col">
                  <span
                    title={doc.filename}
                    className="text-sm text-gray-900 font-medium whitespace-normal break-words leading-snug"
                  >
                    {doc.title || doc.filename}
                  </span>

                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-xs font-medium">
                      {doc.doc_type}
                    </span>

                    {doc.document_year && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
                        {doc.document_year}
                      </span>
                    )}

                    {doc.is_archived ? (
                      <span className="bg-gray-200 text-gray-800 px-2 py-0.5 rounded-full text-xs font-medium">
                        Archived
                      </span>
                    ) : doc.is_published ? (
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">
                        Published
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-medium">
                        Unpublished
                      </span>
                    )}

                    {doc.is_published && !doc.is_archived && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          doc.is_public
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {doc.is_public ? "Public" : "Members only"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600 mt-auto">
                {isPending ? (
                  <span className="italic text-gray-500 flex items-center gap-1">
                    <Spinner className="w-4 h-4 animate-spin" />
                    Reviewing and categorizing automatically…
                  </span>
                ) : isConfirmingDelete ? (
                  <div className="text-sm mt-2 space-y-2">
                    <p className="text-gray-700">
                      Are you sure you want to delete this file?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDeletingId(null)}
                        className="text-sm px-3 py-1 border rounded text-gray-700 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id, doc.storage_path)}
                        disabled={deletingInProgress}
                        className={`text-sm px-3 py-1 rounded transition text-white ${
                          deletingInProgress
                            ? "bg-red-400 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700"
                        }`}
                      >
                        {deletingInProgress ? (
                          <span className="flex items-center gap-1">
                            <Spinner className="w-4 h-4 animate-spin" />
                            Deleting...
                          </span>
                        ) : (
                          "Delete"
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 mt-3">
                    <a
                      href={previewUrls[doc.id]}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Preview"
                      className="text-blue-600 hover:text-blue-800 transition"
                    >
                      <Eye className="w-5 h-5" weight="regular" />
                    </a>
                    <button
                      onClick={() => setDeletingId(doc.id)}
                      title="Delete"
                      className="text-red-600 hover:text-red-800 transition"
                    >
                      <Trash className="w-5 h-5" weight="regular" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
