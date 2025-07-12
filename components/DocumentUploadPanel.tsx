"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { createClient } from "@/lib/supabase-browser";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface Props {
  tenantSlug: string;
  onUploadComplete?: () => void;
}

type UploadStatus = "uploading" | "success" | "error";

interface FileUpload {
  name: string;
  status: UploadStatus;
  error?: string;
}

export default function DocumentUploadPanel({
  tenantSlug,
  onUploadComplete,
}: Props) {
  const supabase = createClient();
  const [uploads, setUploads] = useState<FileUpload[]>([]);

  const handleUpload = async (files: File[]) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: tenantData } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", tenantSlug)
      .single();

    if (!user?.id || !tenantData?.id) {
      alert("User or tenant not found.");
      return;
    }

    const tenantId = tenantData.id;

    for (const file of files) {
      setUploads((prev) => [...prev, { name: file.name, status: "uploading" }]);

      const { error: uploadError } = await supabase.storage
        .from(`${tenantSlug}-uploads`)
        .upload(file.name, file, { upsert: true });

      if (uploadError) {
        console.error(
          `❌ Upload failed for ${file.name}:`,
          uploadError.message
        );
        setUploads((prev) =>
          prev.map((u) =>
            u.name === file.name
              ? { ...u, status: "error", error: uploadError.message }
              : u
          )
        );
        continue;
      }

      const { data: insertData, error: insertError } = await supabase
        .from("documents")
        .insert([
          {
            tenant_id: tenantId,
            title: file.name,
            filename: file.name,
            storage_path: file.name,
            file_type: file.type,
            uploaded_by: user.id,
            is_public: false,
            is_published: false,
            is_archived: false,
            is_analyzed: false,
            doc_type: "other",
          },
        ])
        .select("id")
        .single();

      if (insertError || !insertData?.id) {
        console.error(
          `❌ Metadata insert failed for ${file.name}:`,
          insertError?.message
        );
        setUploads((prev) =>
          prev.map((u) =>
            u.name === file.name
              ? {
                  ...u,
                  status: "error",
                  error: insertError?.message ?? "Unknown insert error",
                }
              : u
          )
        );
        continue;
      }

      await fetch("/api/analyze-document", {
        method: "POST",
        body: JSON.stringify({
          tenantSlug,
          fileName: file.name,
          documentId: insertData.id,
        }),
        headers: { "Content-Type": "application/json" },
      });

      setUploads((prev) =>
        prev.map((u) =>
          u.name === file.name ? { ...u, status: "success" } : u
        )
      );

      setTimeout(() => {
        setUploads((prev) => prev.filter((u) => u.name !== file.name));
      }, 1000);

      onUploadComplete?.();
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleUpload(acceptedFiles);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  return (
    <div className="border rounded bg-gray-50 p-6 min-h-[12rem] flex flex-col sm:flex-row gap-6">
      {/* Drop Area */}
      <div
        {...getRootProps()}
        className={`flex-1 border-2 border-dashed rounded-lg p-6 flex items-center justify-center text-center cursor-pointer transition ${
          isDragActive ? "bg-blue-50 border-blue-400" : "border-gray-300"
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-gray-600 text-sm">
          Drag and drop files here or click to select
        </p>
      </div>

      {/* Upload Status */}
      <div className="w-full sm:w-64 flex flex-col justify-center">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Upload Status
        </h4>
        {uploads.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No uploads in progress.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {uploads.map((upload) => (
              <li
                key={upload.name}
                className="flex items-center justify-between gap-2"
              >
                <span className="truncate" title={upload.name}>
                  {upload.name}
                </span>
                {upload.status === "uploading" && (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                )}
                {upload.status === "success" && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {upload.status === "error" && (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span title={upload.error}>Error</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
