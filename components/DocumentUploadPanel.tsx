"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { createClient } from "@/lib/supabase-browser";

interface Props {
  tenantSlug: string;
}

export default function DocumentUploadPanel({ tenantSlug }: Props) {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);

  const handleUpload = async (files: File[]) => {
    setUploading(true);
    setCompleted(0);
    setTotal(files.length);
    setFailed([]);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      console.error("❌ No valid user session:", userError);
      setFailed(files.map((f) => f.name));
      setUploading(false);
      return;
    }

    const { data: tenantData, error: tenantError } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", tenantSlug)
      .single();

    if (tenantError || !tenantData?.id) {
      console.error("❌ Tenant lookup failed:", tenantError);
      setFailed(files.map((f) => f.name));
      setUploading(false);
      return;
    }

    const tenantId = tenantData.id;

    for (const file of files) {
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(`${tenantSlug}-uploads`)
        .upload(file.name, file, { upsert: true });

      if (uploadError) {
        console.error(
          `❌ Upload failed for ${file.name}:`,
          uploadError.message
        );
        setFailed((prev) => [...prev, `${file.name} (upload failed)`]);
        continue;
      }

      // Insert metadata record
      const { error: insertError } = await supabase.from("documents").insert([
        {
          tenant_id: tenantId,
          title: file.name,
          filename: file.name,
          storage_path: file.name,
          file_type: file.type,
          uploaded_by: user.id,
          is_public: false,
          is_published: false,
          doc_type: "other",
        },
      ]);

      if (insertError) {
        console.error(
          `❌ Metadata insert failed for ${file.name}:`,
          insertError.message
        );
        setFailed((prev) => [...prev, `${file.name} (insert failed)`]);
      }

      setCompleted((prev) => prev + 1);
    }

    setUploading(false);
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
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition cursor-pointer ${
          isDragActive ? "bg-blue-50 border-blue-400" : "bg-gray-50"
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-gray-600">
          Drag and drop files here or click to select
        </p>
      </div>

      {(uploading || completed > 0) && (
        <div className="text-sm text-gray-700 text-center">
          {uploading
            ? `Uploading ${completed} of ${total} files...`
            : `Uploaded ${completed} of ${total} files.`}
        </div>
      )}

      {failed.length > 0 && (
        <div className="text-sm text-red-600 text-center">
          ⚠️ {failed.length} failed
          <span
            title={failed.join("\n")}
            className="ml-1 cursor-help underline decoration-dotted"
          >
            (view details)
          </span>
        </div>
      )}
    </div>
  );
}
