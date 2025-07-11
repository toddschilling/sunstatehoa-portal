// app/admin/documents/page.tsx
import { loadTenantContext } from "@/lib/loadTenantContext";
import AdminDocumentsClientPage from "@/components/AdminDocumentsClientPage";

export default async function AdminDocumentsPage() {
  const { tenant, user, role, error } = await loadTenantContext();

  if (error || !tenant) {
    return (
      <main className="p-10 text-center text-red-600">
        {error || "Unable to load tenant information."}
      </main>
    );
  }

  if (role !== "admin") {
    return (
      <main className="p-10 text-center text-red-600">
        You do not have permission to view this page.
      </main>
    );
  }

  return <AdminDocumentsClientPage tenantSlug={tenant.slug} />;
}
