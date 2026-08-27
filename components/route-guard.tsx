'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';

const AUTH_PAGES = ['/auth/login', '/auth/signup'];

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isDemoMode } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = AUTH_PAGES.includes(pathname);

  useEffect(() => {
    if (loading) return;

    if (!user && !isDemoMode && !isAuthPage) {
      router.push('/auth/login');
    }

    if ((user || isDemoMode) && isAuthPage) {
      router.push('/');
    }
  }, [user, loading, isDemoMode, isAuthPage, router, pathname]);

  // Show auth pages without the full layout
  if (isAuthPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && !isDemoMode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
