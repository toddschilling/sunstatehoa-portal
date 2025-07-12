"use client";

import { useEffect, useState } from "react";

export interface FilterState {
  search?: string;
  year?: string;
  docType?: string;
  published?: string;
  archived?: string;
  visibility?: string;
}

interface Props {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export default function FilterBar({ filters, onFiltersChange }: Props) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  useEffect(() => {
    onFiltersChange(localFilters);
  }, [localFilters]);

  return (
    <div className="flex flex-wrap gap-4 items-center">
      <input
        type="text"
        placeholder="Search by title"
        value={localFilters.search || ""}
        onChange={(e) =>
          setLocalFilters({ ...localFilters, search: e.target.value })
        }
        className="border px-3 py-2 rounded w-64 text-sm"
      />

      <select
        value={localFilters.year || ""}
        onChange={(e) =>
          setLocalFilters({ ...localFilters, year: e.target.value })
        }
        className="border px-3 py-2 rounded text-sm"
      >
        <option value="">All Years</option>
        {Array.from({ length: 10 }, (_, i) => {
          const y = new Date().getFullYear() - i;
          return (
            <option key={y} value={y}>
              {y}
            </option>
          );
        })}
      </select>

      <select
        value={localFilters.docType || ""}
        onChange={(e) =>
          setLocalFilters({ ...localFilters, docType: e.target.value })
        }
        className="border px-3 py-2 rounded text-sm"
      >
        <option value="">All Types</option>
        {[
          "bylaws",
          "declaration",
          "articles",
          "rules",
          "budget",
          "financials",
          "minutes",
          "notices",
          "contracts",
          "insurance",
          "other",
        ].map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>

      <select
        value={localFilters.published || ""}
        onChange={(e) =>
          setLocalFilters({ ...localFilters, published: e.target.value })
        }
        className="border px-3 py-2 rounded text-sm"
      >
        <option value="">All Statuses</option>
        <option value="true">Published</option>
        <option value="false">Unpublished</option>
      </select>

      <select
        value={localFilters.archived || ""}
        onChange={(e) =>
          setLocalFilters({ ...localFilters, archived: e.target.value })
        }
        className="border px-3 py-2 rounded text-sm"
      >
        <option value="">All</option>
        <option value="false">Active</option>
        <option value="true">Archived</option>
      </select>

      <select
        value={localFilters.visibility || ""}
        onChange={(e) =>
          setLocalFilters({ ...localFilters, visibility: e.target.value })
        }
        className="border px-3 py-2 rounded text-sm"
      >
        <option value="">All Visibility</option>
        <option value="public">Public</option>
        <option value="private">Members only</option>
      </select>
    </div>
  );
}
