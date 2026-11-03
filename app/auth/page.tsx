'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Alert, Brand, EmptyConfiguration, GlowButton, InputField } from '@/components/ui';
import { friendlyError, isConfigured, supabase } from '@/lib/supabase';

function safeNext(value: string | null): string { return value?.startsWith('/') && !value.startsWith('//') && !value.includes('\\') ? value : '/groups'; }

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [next, setNext] = useState('/groups');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setMode(q.get('mode') === 'signup' ? 'signup' : 'login');
    const target = safeNext(q.get('next'));
    setNext(target);
    if (isConfigured()) supabase().auth.getSession().then(({data})=>{ if (data.session) window.location.replace(target); });
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault(); setPending(true); setMessage(''); setSuccess('');
    try {
      if (mode === 'signup') {
        if (!name.trim()) throw new Error('Please enter your name.');
        if (password.length < 8) throw new Error('Use a password of at least 8 characters.');
        const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
        const { data, error } = await supabase().auth.signUp({ email: email.trim(), password, options: { data: { display_name: name.trim() }, emailRedirectTo } });
        if (error) throw error;
        if (data.session) window.location.assign(next);
        else setSuccess('Check your email for a confirmation link. After confirming, come back to join your crew.');
      } else {
        const { error } = await supabase().auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        window.location.assign(next);
      }
    } catch (err) { setMessage(friendlyError(err)); }
    finally { setPending(false); }
  }

  if (!isConfigured()) return <main className="center-layout"><EmptyConfiguration/></main>;
  return <main className="auth-layout">
    <section className="auth-visual"><div className="auth-image"/><div className="auth-art-content"><Brand/><div><span className="eyebrow">THE GOOD STUFF STAYS A SECRET</span><h1>MAKE SHIRTS.<br/><span>MAKE MEMORIES.</span></h1><p>Rally the crew. Draw your match. Show up in something legendary.</p></div><span className="auth-foot">THE BEST NIGHTS ARE BETTER TOGETHER.</span></div></section>
    <section className="auth-form-area"><div className="auth-form-wrap"><Link className="auth-back" href="/">← Back to the party</Link><div className="mobile-auth-brand"><Brand/></div><span className="eyebrow">JOIN THE EXPERIENCE</span><h2>{mode==='login' ? 'Welcome back.' : 'Join the crew.'}</h2><p>{mode==='login' ? 'Your secret assignment is waiting whenever you need it.' : 'Create an account to join any exchange, now or later.'}</p>
      <div className="auth-toggle"><button type="button" className={mode==='login' ? 'active' : ''} onClick={()=>{setMode('login');setMessage('');setSuccess('');}}>Log in</button><button type="button" className={mode==='signup' ? 'active' : ''} onClick={()=>{setMode('signup');setMessage('');setSuccess('');}}>Sign up</button></div>
      <form onSubmit={submit} className="form-stack">
        {mode==='signup' && <InputField label="Your name"><div className="input-icon"><UserRound size={17}/><input autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="What your crew calls you" maxLength={60} required/></div></InputField>}
        <InputField label="Email address"><div className="input-icon"><Mail size={17}/><input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></div></InputField>
        <InputField label="Password"><div className="input-icon"><LockKeyhole size={17}/><input type={showPassword ? 'text' : 'password'} minLength={mode === 'signup' ? 8 : undefined} autoComplete={mode==='signup' ? 'new-password' : 'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode==='signup' ? 'At least 8 characters' : 'Your password'} required/><button type="button" className="password-eye" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></InputField>
        {mode === 'login' && <div className="forgot-row"><Link href="/auth/reset">Forgot password?</Link></div>}{message && <Alert message={message}/>} {success && <Alert message={success} tone="success"/>}
        <GlowButton className="full-width" type="submit" loading={pending}>{mode==='login' ? 'Log in to my groups' : 'Create my account'} <ArrowRight size={18}/></GlowButton>
      </form>
      <div className="auth-note"><LockKeyhole size={15}/>Your account is protected by Supabase authentication.</div>
    </div></section>
  </main>;
}
