// app/portal/member/page.tsx
import { loadTenantContext } from '@/lib/loadTenantContext';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function MemberPage() {

  const { tenant, user, role, error } = await loadTenantContext();

  if (error || !tenant) {
    return (
      <main className="p-10 text-center text-red-600">
        {error || 'Unable to load tenant.'}
      </main>
    );
  }
  
  /* ─── render ────────────────────────────────── */
  return (
    <main className="p-10 space-y-6">
      <h1 className="text-3xl font-bold text-center">
        {tenant?.name ?? 'HOA'} &mdash; Member&nbsp;Portal
      </h1>

      <p className="text-center">
        Welcome back, <strong>{user?.email}</strong>!
      </p>

      <section className="max-w-4xl mx-auto space-y-4">
        {/* replace these placeholders with real components */}
        <ul className="list-disc list-inside space-y-2">
          <li>Pay dues / view account balance</li>
          <li>Submit Architectural Review requests</li>
          <li>Report maintenance issues or violations</li>
          <li>Download private documents &amp; newsletters</li>
          <li>View upcoming board agendas &amp; minutes</li>
        </ul>
      </section>

      {user?.role === 'admin' && (
      <p className="text-sm">
        <Link href="/admin/documents" className="text-blue-600 hover:underline">
          Manage Documents
        </Link>
      </p>
      )}

    </main>
  );
}
