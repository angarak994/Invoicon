'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../auth/AuthProvider';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!loading && !user) {
      // Redirect to login, storing previous path for redirect-back operations
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-[var(--brand-color)]"></div>
          <p className="font-sans text-sm font-semibold text-gray-500 dark:text-gray-400">Restoring secure session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Prevents flashing protected elements while redirecting
  }

  return <>{children}</>;
}
