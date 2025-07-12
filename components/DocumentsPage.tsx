"use client";

import { useEffect, useState } from "react";
import DocumentUploadPanel from "@/components/DocumentUploadPanel";
import DocumentsViewPanel from "@/components/DocumentsViewPanel";
console.log("👁️ Importing DocumentsViewPanel directly");

import FilterBar, { FilterState } from "@/components/FilterBar";

interface Props {
  tenantSlug: string;
}

export default function DocumentsPage({ tenantSlug }: Props) {
  const [version, setVersion] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    year: "",
    docType: "",
    published: "",
    archived: "",
    visibility: "",
  });

  console.log("📄 DocumentsPage loaded", { tenantSlug, filters });

  const [activeFilters, setActiveFilters] = useState(filters);

  const refreshDocuments = () => setVersion((v) => v + 1);

  // Debounce filter updates (optional)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setActiveFilters(filters);
    }, 300);
    return () => clearTimeout(timeout);
  }, [filters]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div>
        <DocumentUploadPanel
          tenantSlug={tenantSlug}
          onUploadComplete={refreshDocuments}
        />
      </div>

      <div className="mt-6">
        <FilterBar filters={filters} onFiltersChange={setFilters} />
      </div>

      <div className="mt-10">
        <DocumentsViewPanel
          tenantSlug={tenantSlug}
          version={version}
          filters={activeFilters}
        />
      </div>
    </div>
  );
}
