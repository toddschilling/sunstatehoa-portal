'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export default function LogoutButton({ className = '' }: { className?: string }) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout failed:', error.message);
    } else {
      router.refresh(); // or router.push('/login') if you want to redirect after logout
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={className || 'text-sm text-red-600 hover:underline'}
    >
      Logout
    </button>
  );
}
