// lib/extractTenantSlug.ts
export function extractTenantSlug(host: string): string | null {
  if (!host || host.includes("localhost")) return null;
  const parts = host.split(".");
  if (parts.length < 3) return null; // e.g., sunstatehoa.com
  return parts[0]; // e.g., 'country-manor'
}
