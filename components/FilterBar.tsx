"use client";

import { useState } from "react";

export default function FilterBar() {
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [docType, setDocType] = useState("");
  const [published, setPublished] = useState("");
  const [archived, setArchived] = useState("");

  return (
    <div className="flex flex-wrap gap-4 items-center">
      <input
        type="text"
        placeholder="Search by title"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border px-3 py-2 rounded w-64 text-sm"
      />

      <select
        value={year}
        onChange={(e) => setYear(e.target.value)}
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
        value={docType}
        onChange={(e) => setDocType(e.target.value)}
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
        value={published}
        onChange={(e) => setPublished(e.target.value)}
        className="border px-3 py-2 rounded text-sm"
      >
        <option value="">All Statuses</option>
        <option value="true">Published</option>
        <option value="false">Unpublished</option>
      </select>

      <select
        value={archived}
        onChange={(e) => setArchived(e.target.value)}
        className="border px-3 py-2 rounded text-sm"
      >
        <option value="">All</option>
        <option value="false">Active</option>
        <option value="true">Archived</option>
      </select>
    </div>
  );
}
