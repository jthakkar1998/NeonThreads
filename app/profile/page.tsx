'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { AuthGate } from '@/components/AuthGate';
import { AppShell } from '@/components/AppShell';
import { Alert, GlowButton, InputField, PageHeading } from '@/components/ui';
import { api } from '@/lib/api';
import { friendlyError } from '@/lib/supabase';

function ProfileContent() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(()=>{api.myProfile().then(p=>{if(p){setName(p.display_name);setEmail(p.email);}}).catch(e=>setError(friendlyError(e)));},[]);
  async function submit(e: FormEvent) {e.preventDefault();setPending(true);setError('');setSuccess('');try {await api.updateProfile(name);setSuccess('Your display name has been updated for all your groups.');}catch(e){setError(friendlyError(e));}finally{setPending(false);}}
  return <AppShell active="profile"><PageHeading eyebrow="YOUR IDENTITY" title="Your profile" description="A name your crew knows. A login only you control."/>
    <div className="profile-grid"><section className="panel profile-panel"><div className="panel-heading"><span className="panel-icon"><UserRound size={22}/></span><div><h2>Account details</h2><p>Update the name shown on your crew&apos;s roster.</p></div></div><form className="form-stack" onSubmit={submit}><InputField label="Display name"><input value={name} maxLength={60} minLength={1} required onChange={e=>setName(e.target.value)}/></InputField><InputField label="Email address"><div className="input-icon"><Mail size={16}/><input value={email} disabled readOnly/></div></InputField><div className="auth-note"><LockKeyhole size={15}/>Your password is managed securely through Supabase Auth.</div>{error && <Alert message={error}/>} {success && <Alert message={success} tone="success"/>}<GlowButton type="submit" loading={pending}>Save changes <ArrowRight size={17}/></GlowButton></form></section><aside className="panel profile-aside"><div className="profile-orb"><UserRound size={48}/></div><h3>Ready for the next drop?</h3><p>Your account works across every exchange group you join. Your shirt size is saved separately for each event.</p></aside></div>
  </AppShell>;
}
export default function ProfilePage() {return <AuthGate>{()=><ProfileContent/>}</AuthGate>;}
