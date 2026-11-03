'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { Alert, Brand, EmptyConfiguration, GlowButton, InputField } from '@/components/ui';
import { friendlyError, isConfigured, supabase } from '@/lib/supabase';

export default function UpdatePasswordPage() {
  const [password,setPassword] = useState('');
  const [valid,setValid] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [success,setSuccess] = useState('');
  useEffect(()=>{if(!isConfigured())return; supabase().auth.getSession().then(({data})=>setValid(Boolean(data.session))); const {data:{subscription}}=supabase().auth.onAuthStateChange((_,session)=>setValid(Boolean(session)));return()=>subscription.unsubscribe();},[]);
  async function submit(e:FormEvent){e.preventDefault();setError('');setSuccess('');setBusy(true);try{if(password.length<8)throw new Error('Use at least 8 characters.');const {error}=await supabase().auth.updateUser({password});if(error)throw error;setSuccess('Your password has been updated. You can open your groups now.');}catch(err){setError(friendlyError(err));}finally{setBusy(false);}}
  if(!isConfigured())return <main className="center-layout"><EmptyConfiguration/></main>;
  return <main className="center-layout"><section className="auth-simple-card"><Brand/><div className="eyebrow">SECURE YOUR ACCESS</div><h1>Set a new password.</h1><p>{valid ? 'Choose a new password to access your exchange groups.' : 'Open this page from the password recovery email to verify your account.'}</p>{valid && !success && <form className="form-stack" onSubmit={submit}><InputField label="New password"><div className="input-icon"><LockKeyhole size={17}/><input type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" required/></div></InputField>{error && <Alert message={error}/>}<GlowButton type="submit" loading={busy} className="full-width">Update password <ArrowRight size={17}/></GlowButton></form>}{error && !valid && <Alert message={error}/>} {success && <Alert message={success} tone="success"/>}<Link className="simple-back" href="/groups">Go to my groups →</Link></section></main>;
}
