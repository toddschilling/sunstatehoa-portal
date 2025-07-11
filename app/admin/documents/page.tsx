// app/admin/documents/page.tsx
import { loadTenantContext } from '@/lib/loadTenantContext';
import DocumentUploader from '@/components/DocumentUploader';

export default async function AdminDocumentsPage() {
  const { tenant, user, role, error } = await loadTenantContext();

  if (error || !tenant) {
    return (
      <main className="p-10 text-center text-red-600">
        {error}
      </main>
    );
  }

  // ⛔️ Check if user is an admin (example: based on Supabase role claim or tenant_membership table)
  const isAdmin = role === 'admin'; // TODO: customize to your access model

  if (!isAdmin) {
    return (
      <main className="p-10 text-center text-red-600">
        You do not have permission to view this page.
      </main>
    );
  }

  return (
    <main className="p-10">
      <h1 className="text-3xl font-semibold mb-6">Upload a New Document</h1>
      <DocumentUploader tenantSlug={tenant.slug} />
    </main>
  );
}
