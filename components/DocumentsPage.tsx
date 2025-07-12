"use client";

import { useState } from "react";
import DocumentUploadPanel from "@/components/DocumentUploadPanel";
import DocumentViewPanel from "@/components/DocumentViewPanel";
import FilterBar from "@/components/FilterBar";

interface Props {
  tenantSlug: string;
}

export default function DocumentsPage({ tenantSlug }: Props) {
  const [version, setVersion] = useState(0);
  const refreshDocuments = () => setVersion((v) => v + 1);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <FilterBar />
      <div className="mt-8">
        <DocumentUploadPanel
          tenantSlug={tenantSlug}
          onUploadComplete={refreshDocuments}
        />
      </div>
      <div className="mt-10">
        <DocumentViewPanel tenantSlug={tenantSlug} version={version} />
      </div>
    </div>
  );
}
