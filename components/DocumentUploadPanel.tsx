"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { createClient } from "@/lib/supabase-browser";
import { FileIcon } from "lucide-react";

interface Props {
  tenantSlug: string;
}

export default function DocumentUploadPanel({ tenantSlug }: Props) {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<string[]>([]);

  const handleUpload = async (selectedFiles: File[]) => {
    setUploading(true);
    setMessages([]);

    for (const file of selectedFiles) {
      const { error } = await supabase.storage
        .from(`${tenantSlug}-uploads`)
        .upload(`${file.name}`, file, {
          upsert: true,
        });

      setMessages((prev) => [
        ...prev,
        error ? `❌ Failed: ${file.name}` : `✅ Uploaded: ${file.name}`,
      ]);
    }

    setUploading(false);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    handleUpload(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    setFiles(selected);
    handleUpload(selected);
  };

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`p-8 border-2 border-dashed rounded-lg text-center transition ${
          isDragActive ? "bg-blue-100 border-blue-400" : "bg-gray-50"
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-gray-600">
          Drag & drop documents here, or click to select files
        </p>
      </div>

      <div className="text-center">
        <label className="cursor-pointer text-blue-600 underline">
          Or choose files manually
          <input
            type="file"
            multiple
            onChange={handleManualUpload}
            className="hidden"
          />
        </label>
      </div>

      {uploading && (
        <p className="text-center text-sm text-gray-500">Uploading…</p>
      )}

      {messages.length > 0 && (
        <ul className="text-sm space-y-1 text-center">
          {messages.map((msg, idx) => (
            <li key={idx}>{msg}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
