// components/AdminDocumentsClientPage.tsx
"use client";

import { useState } from "react";
import DocumentUploadPanel from "@/components/DocumentUploadPanel";
import DocumentStagingPanel from "@/components/DocumentStagingPanel";

export default function AdminDocumentsClientPage({
  tenantSlug,
}: {
  tenantSlug: string;
}) {
  const [uploadVersion, setUploadVersion] = useState(0);

  const handleUploadComplete = () => {
    setUploadVersion((v) => v + 1);
  };

  return (
    <main className="p-10">
      <h1 className="text-3xl font-semibold mb-6">Manage Documents</h1>
      <DocumentUploadPanel
        tenantSlug={tenantSlug}
        onUploadComplete={handleUploadComplete}
      />
      <hr className="my-6" />
      <DocumentStagingPanel tenantSlug={tenantSlug} version={uploadVersion} />
    </main>
  );
}
