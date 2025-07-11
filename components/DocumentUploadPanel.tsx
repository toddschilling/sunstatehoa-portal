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

      // 1. Upload file to storage
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

      // 2. Insert metadata row into `documents`
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
            is_analyzed: false, // new field
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

      // 3. Trigger analysis API
      await fetch("/api/analyze-document", {
        method: "POST",
        body: JSON.stringify({
          tenantSlug,
          fileName: file.name,
          documentId: insertData.id,
        }),
        headers: { "Content-Type": "application/json" },
      });

      // 4. Mark upload success
      setUploads((prev) =>
        prev.map((u) =>
          u.name === file.name ? { ...u, status: "success" } : u
        )
      );

      // 5. Auto-remove from status panel
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
    <div className="flex flex-col md:flex-row gap-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`flex-1 border-2 border-dashed rounded-lg p-6 text-center transition cursor-pointer ${
          isDragActive ? "bg-blue-50 border-blue-400" : "bg-gray-50"
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-gray-600">
          Drag and drop files here or click to select
        </p>
      </div>

      {/* Upload Status */}
      <div className="flex-1 border rounded-lg p-4 bg-white shadow-sm">
        <h3 className="text-sm font-semibold mb-2">Upload Status</h3>
        {uploads.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No uploads in progress.
          </p>
        ) : (
          <ul className="space-y-2">
            {uploads.map((upload) => (
              <li
                key={upload.name}
                className="flex items-center justify-between text-sm"
              >
                <span>{upload.name}</span>
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
