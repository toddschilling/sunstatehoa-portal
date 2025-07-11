// app/admin/documents/page.tsx
import { loadTenantContext } from "@/lib/loadTenantContext";
import DocumentUploadPanel from "@/components/DocumentUploadPanel";

export default async function AdminDocumentsPage() {
  const { tenant, user, role, error } = await loadTenantContext();

  if (error || !tenant) {
    return (
      <main className="p-10 text-center text-red-600">
        {error || "Unable to load tenant information."}
      </main>
    );
  }

  const isAdmin = role === "admin";

  if (!isAdmin) {
    return (
      <main className="p-10 text-center text-red-600">
        You do not have permission to view this page.
      </main>
    );
  }

  return (
    <main className="p-10">
      <h1 className="text-3xl font-semibold mb-6">Manage Documents</h1>
      <DocumentUploadPanel tenantSlug={tenant.slug} />
    </main>
  );
}
