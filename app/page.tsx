import Link from "next/link";
import { loadTenantContext } from "@/lib/loadTenantContext";
import { createClient } from "@/lib/supabase";
import { DocumentRow } from "@/lib/types";

export default async function TenantLandingPage() {
  const { tenant, user, role, error } = await loadTenantContext();

  if (error || !tenant) {
    return (
      <main className="p-10 text-center text-red-600">
        {error || "Unable to load tenant."}
      </main>
    );
  }

  const supabase = createClient();

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("is_published", true)
    .order("uploaded_at", { ascending: false });

  const publicDocs = documents?.filter((doc) => doc.is_public) || [];
  const privateDocs = documents?.filter((doc) => !doc.is_public) || [];

  const publicBucket = `${tenant.slug}-public`;
  const privateBucket = `${tenant.slug}-private`;

  // 🔓 Public docs – use getPublicUrl
  const publicWithUrls = await Promise.all(
    publicDocs.map(async (doc) => {
      const path = doc.storage_path;

      console.log("🔍 Resolving public URL:", {
        doc_id: doc.id,
        title: doc.title,
        bucket: publicBucket,
        path,
      });

      const { data } = supabase.storage.from(publicBucket).getPublicUrl(path);

      return {
        ...doc,
        url: data?.publicUrl || null,
      };
    })
  );

  // 🔒 Private docs – use signed URLs
  const privateWithUrls = user
    ? await Promise.all(
        privateDocs.map(async (doc) => {
          const path = doc.storage_path;

          console.log("🔐 Generating signed URL for private doc:", {
            doc_id: doc.id,
            title: doc.title,
            bucket: privateBucket,
            path,
          });

          const { data: signed, error } = await supabase.storage
            .from(privateBucket)
            .createSignedUrl(path, 3600);

          if (error) {
            console.error(
              `❌ Failed to sign private doc "${doc.title}"`,
              error.message
            );
          }

          return {
            ...doc,
            url: signed?.signedUrl || null,
          };
        })
      )
    : [];

  return (
    <main className="p-10">
      <section className="max-w-4xl mx-auto space-y-10">
        {/* ---------- header ---------- */}
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold">{tenant.name}</h1>
          <p className="text-gray-600">Official Homeowners-Association site</p>
        </header>

        {/* ---------- public documents ---------- */}
        <article className="space-y-4">
          <h2 className="text-2xl font-semibold">Public Documents</h2>
          {publicWithUrls.length === 0 ? (
            <p className="text-gray-600">No public documents available yet.</p>
          ) : (
            <ul className="space-y-2">
              {publicWithUrls.map((doc) => (
                <li
                  key={doc.id}
                  className="flex justify-between items-center border-b py-2"
                >
                  <div>
                    <p className="font-medium text-gray-800">{doc.title}</p>
                    <p className="text-sm text-gray-500 capitalize">
                      {doc.doc_type}
                    </p>
                  </div>
                  {doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Download
                    </a>
                  ) : (
                    <span className="text-red-500 text-sm">Unavailable</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </article>

        {/* ---------- sign-in call-to-action ---------- */}
        {!user && (
          <div className="text-center">
            <Link
              href="/login"
              className="inline-block rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700 transition"
            >
              Member Login
            </Link>
          </div>
        )}

        {/* ---------- private documents (if signed in) ---------- */}
        {user && (
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Private Documents</h2>
            {privateWithUrls.length === 0 ? (
              <p className="text-gray-500">
                No private documents available yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {privateWithUrls.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex justify-between items-center border-b py-2"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{doc.title}</p>
                      <p className="text-sm text-gray-500 capitalize">
                        {doc.doc_type}
                      </p>
                    </div>
                    {doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Download
                      </a>
                    ) : (
                      <span className="text-red-500 text-sm">Unavailable</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* ---------- admin tools ---------- */}
        {role === "admin" && (
          <p className="text-sm">
            <Link
              href="/admin/documents"
              className="text-blue-600 hover:underline"
            >
              Manage Documents
            </Link>
          </p>
        )}
      </section>
    </main>
  );
}
