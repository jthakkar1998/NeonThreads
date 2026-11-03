'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { ArrowRight, Mail } from 'lucide-react';
import { Alert, Brand, EmptyConfiguration, GlowButton, InputField } from '@/components/ui';
import { friendlyError, isConfigured, supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const [email,setEmail] = useState('');
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [success,setSuccess] = useState('');
  async function submit(e:FormEvent) {
    e.preventDefault();setBusy(true);setError('');setSuccess('');
    try {
      const {error} = await supabase().auth.resetPasswordForEmail(email.trim(),{redirectTo:`${window.location.origin}/auth/update-password`});
      if(error) throw error;
      setSuccess('If there is an account for this email, you will receive a password reset link shortly.');
    } catch(err) {setError(friendlyError(err));} finally{setBusy(false);}
  }
  if (!isConfigured()) return <main className="center-layout"><EmptyConfiguration/></main>;
  return <main className="center-layout"><section className="auth-simple-card"><Brand/><div className="eyebrow">ACCOUNT RECOVERY</div><h1>Forgot your password?</h1><p>Enter your account email and we&apos;ll send a secure link so you can get back to your crew.</p><form className="form-stack" onSubmit={submit}><InputField label="Email address"><div className="input-icon"><Mail size={17}/><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div></InputField>{error && <Alert message={error}/>} {success && <Alert message={success} tone="success"/>}<GlowButton type="submit" className="full-width" loading={busy}>Email me a reset link <ArrowRight size={17}/></GlowButton></form><Link className="simple-back" href="/auth">← Back to login</Link></section></main>;
}
