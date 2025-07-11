import { loadTenantContext } from "@/lib/loadTenantContext";
import "./globals.css";
import { Inter } from "next/font/google";
import LogoutButton from '@/components/LogoutButton';

const inter = Inter({ subsets: ["latin"] });


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}

async function Navbar() {
  const { tenant, user, role, error } = await loadTenantContext();

  if (error || !tenant) {
    return (
      <main className="p-10 text-center text-red-600">
        {error || "Unable to load tenant."}
      </main>
    );
  }

  return (
    <header className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <a href="/" className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Sun State HOA"
            className="h-10 w-auto"
          />
          <span className="text-xl font-semibold text-gray-800">
            {tenant.name}
          </span>
        </a>
        <nav className="hidden md:flex items-center space-x-6 text-gray-600">
          {user?.email && (
            <>
              <span className="text-sm text-gray-700">{user.email}</span>
              <LogoutButton className="ml-4 text-sm text-red-600 hover:underline" />
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-white border-t text-sm text-gray-500">
      <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
        <p>&copy; {new Date().getFullYear()} Sun State HOA. All rights reserved.</p>
        <div className="flex space-x-4">
          <a href="/privacy" className="hover:text-gray-700">Privacy</a>
          <a href="/terms" className="hover:text-gray-700">Terms</a>
        </div>
      </div>
    </footer>
  );
}
