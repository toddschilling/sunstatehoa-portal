"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { FileText } from "lucide-react";

interface Props {
  tenantSlug: string;
}

export default function DocumentStagingPanel({ tenantSlug }: Props) {
  const supabase = createClient();
  const [files, setFiles] = useState<
    { name: string; signedUrl: string | null }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      const { data, error } = await supabase.storage
        .from(`${tenantSlug}-uploads`)
        .list("", { limit: 100 });

      if (error || !data) {
        console.error("Error listing files:", error);
        setFiles([]);
        setLoading(false);
        return;
      }

      const fileEntries = await Promise.all(
        data.map(async (file) => {
          const { data: urlData, error: urlError } = await supabase.storage
            .from(`${tenantSlug}-uploads`)
            .createSignedUrl(`${file.name}`, 60 * 10); // 10 mins

          return {
            name: file.name,
            signedUrl: urlError ? null : (urlData?.signedUrl ?? null),
          };
        })
      );

      setFiles(fileEntries);
      setLoading(false);
    };

    fetchFiles();
  }, [tenantSlug]);

  if (loading) {
    return (
      <p className="text-center text-sm text-gray-500">Loading documents…</p>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-sm text-gray-600 text-center mt-4">
        No unpublished documents found in staging.
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Unpublished Documents</h2>
      <ul className="space-y-2">
        {files.map((file) => (
          <li
            key={file.name}
            className="border p-4 rounded flex items-center justify-between shadow-sm bg-white"
          >
            <div className="flex items-center gap-3">
              <FileText className="text-gray-400 w-5 h-5" />
              <span className="text-sm font-medium text-gray-800">
                {file.name}
              </span>
            </div>
            {file.signedUrl ? (
              <a
                href={file.signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-sky-600 hover:underline"
              >
                Preview
              </a>
            ) : (
              <span className="text-sm text-red-500">Unable to preview</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
