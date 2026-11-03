'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Brand } from '@/components/ui';
import { friendlyError, isConfigured, supabase } from '@/lib/supabase';
import { SpinnerPage } from '@/components/SpinnerPage';

export default function AuthCallback() {
  const [error, setError] = useState('');
  useEffect(() => {
    async function finish() {
      try {
        if (!isConfigured()) throw new Error('Supabase has not been configured yet.');
        const params = new URLSearchParams(window.location.search);
        const nextParam = params.get('next');
        const next = nextParam?.startsWith('/') && !nextParam.startsWith('//') && !nextParam.includes('\\') ? nextParam : '/groups';
        const code = params.get('code');
        if (code) {
          const { error: exchangeError } = await supabase().auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }
        const { data, error: sessionError } = await supabase().auth.getSession();
        if (sessionError) throw sessionError;
        if (!data.session) throw new Error('Could not establish your session. Please log in.');
        window.location.replace(next);
      } catch (err) { setError(friendlyError(err)); }
    }
    void finish();
  }, []);
  if (!error) return <SpinnerPage/>;
  return <main className="center-layout"><div className="auth-error-card"><Brand/><Alert message={error}/><Link className="btn btn-primary" href="/auth">Return to login</Link></div></main>;
}
