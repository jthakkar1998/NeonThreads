'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { isConfigured, supabase } from '@/lib/supabase';
import { EmptyConfiguration } from '@/components/ui';
import { SpinnerPage } from '@/components/SpinnerPage';

export function AuthGate({ children }: { children: (user: User) => React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isConfigured()) { setLoading(false); return; }
    let active = true;
    supabase().auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.user) {
        const target = (pathname || '/groups') + window.location.search;
        router.replace(`/auth?next=${encodeURIComponent(target)}`);
      } else { setUser(data.user); setLoading(false); }
    });
    const { data: { subscription } } = supabase().auth.onAuthStateChange((_, session) => {
      if (active && !session && _ === 'SIGNED_OUT') {
        setUser(null);
        const target = (pathname || '/groups') + window.location.search;
        router.replace(`/auth?next=${encodeURIComponent(target)}`);
      }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [pathname, router]);

  if (!isConfigured()) return <main className="center-layout"><EmptyConfiguration /></main>;
  if (loading || !user) return <SpinnerPage />;
  return <>{children(user)}</>;
}
