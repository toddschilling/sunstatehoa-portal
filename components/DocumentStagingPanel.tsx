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

interface DocumentRow {
  id: string;
  title: string;
  filename: string;
  storage_path: string;
  uploaded_at: string;
  doc_type: string;
  description: string | null;
  is_archived: boolean;
  is_analyzed: boolean;
  file_type: string | null;
  document_year: number | null;
}

interface Props {
  tenantSlug: string;
  version: number;
}

function getFileIcon(fileType?: string | null) {
  if (!fileType) {
    return (
      <span title="Unknown file type">
        <File size={20} weight="regular" className="text-gray-700" />
      </span>
    );
  }

  const type = fileType.toLowerCase();

  if (type.includes("pdf")) {
    return (
      <span title="PDF Document">
        <FilePdf size={20} weight="duotone" className="text-gray-700" />
      </span>
    );
  }

  if (type.includes("word") || type.includes("doc")) {
    return (
      <span title="Word Document">
        <FileDoc size={20} weight="duotone" className="text-gray-700" />
      </span>
    );
  }

  if (type.includes("xls") || type.includes("sheet") || type.includes("csv")) {
    return (
      <span title="Spreadsheet">
        <FileXls size={20} weight="duotone" className="text-gray-700" />
      </span>
    );
  }

  if (type.includes("image")) {
    return (
      <span title="Image File">
        <FileImage size={20} weight="duotone" className="text-gray-700" />
      </span>
    );
  }

  if (type.includes("zip") || type.includes("archive")) {
    return (
      <span title="Compressed Archive">
        <FileZip size={20} weight="duotone" className="text-gray-700" />
      </span>
    );
  }

  if (type.includes("audio")) {
    return (
      <span title="Audio File">
        <FileAudio size={20} weight="duotone" className="text-gray-700" />
      </span>
    );
  }

  if (type.includes("video")) {
    return (
      <span title="Video File">
        <FileVideo size={20} weight="duotone" className="text-gray-700" />
      </span>
    );
  }

  return (
    <span title="Generic Document">
      <FileText size={20} weight="regular" className="text-gray-700" />
    </span>
  );
}

export default function DocumentStagingPanel({ tenantSlug, version }: Props) {
  const supabase = createClient();
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingInProgress, setDeletingInProgress] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("documents")
        .select(
          "id, title, filename, file_type, storage_path, uploaded_at, doc_type, description, is_archived, is_analyzed, document_year"
        )
        .order("uploaded_at", { ascending: false });

      if (error) {
        console.error("Error fetching documents:", error.message);
        setDocuments([]);
      } else {
        setDocuments(data || []);
        generatePreviewLinks(data || []);
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

    fetchDocuments();
  }, [tenantSlug, version]);

  const handleDelete = async (documentId: string, storagePath: string) => {
    setDeletingInProgress(true);

    const { error: storageError } = await supabase.storage
      .from(`${tenantSlug}-uploads`)
      .remove([storagePath]);

    if (storageError) {
      console.error(
        "❌ Failed to delete file from storage:",
        storageError.message
      );
      alert("Failed to delete file from storage.");
      setDeletingInProgress(false);
      return;
    }

    const { error: dbError } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId);

    if (dbError) {
      console.error("❌ Failed to delete metadata row:", dbError.message);
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
      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(300px,1fr))] justify-start">
        {documents.map((doc) => {
          const isPending = !doc.is_analyzed;
          const isConfirmingDelete = deletingId === doc.id;

          return (
            <div
              key={doc.id}
              className={`border p-4 rounded shadow-sm bg-white w-full max-w-[300px] flex flex-col justify-between h-auto ${
                isPending ? "opacity-60 pointer-events-none" : ""
              }`}
            >
              <div className="flex items-start gap-2 mb-2">
                {getFileIcon(doc.file_type || undefined)}
                <div className="flex flex-col">
                  <span
                    title={doc.filename}
                    className="text-sm text-gray-900 font-medium whitespace-normal break-words leading-snug"
                  >
                    {doc.title || doc.filename}
                  </span>

                  {doc.doc_type && (
                    <span className="mt-1 inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-xs font-medium w-fit">
                      {doc.doc_type}
                    </span>
                  )}

                  {doc.document_year && (
                    <span className="mt-1 inline-block bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs w-fit">
                      {doc.document_year}
                    </span>
                  )}
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
