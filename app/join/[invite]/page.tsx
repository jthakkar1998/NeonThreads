'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, CalendarDays, LockKeyhole, Shirt, Users } from 'lucide-react';
import { Alert, Brand, EmptyConfiguration, GlowButton, Pill } from '@/components/ui';
import { api } from '@/lib/api';
import { formatConcertDate } from '@/lib/date';
import { friendlyError, isConfigured, supabase } from '@/lib/supabase';
import type { InvitePreview } from '@/lib/types';

export default function JoinPage() {
  const params = useParams<{ invite: string }>();
  const invite = params.invite;
  const router = useRouter();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!isConfigured()) { setLoading(false); return; }
    Promise.all([api.previewInvite(invite), supabase().auth.getSession()])
      .then(([p,s])=>{setPreview(p);setAuthenticated(Boolean(s.data.session));if (!p) setError('This invitation link does not exist or is no longer valid.');})
      .catch(err=>setError(friendlyError(err))).finally(()=>setLoading(false));
  }, [invite]);
  async function join() {setPending(true);setError('');try { const id = await api.joinGroup(invite);router.push(`/groups/${id}`);}catch(err){setError(friendlyError(err));}finally{setPending(false);}}
  if (!isConfigured()) return <main className="center-layout"><EmptyConfiguration/></main>;
  return <main className="join-layout"><header className="join-header"><Brand/><Link href="/">← Home</Link></header><div className="join-center"><div className="join-card"><div className="join-stage"><div className="join-stage-shadow"/><span className="join-stage-icon"><Shirt size={46}/></span><span className="eyebrow">YOU'RE INVITED</span><h1>JOIN THE CREW.</h1></div>
    <div className="join-card-body">{loading ? <p>Checking the invitation...</p> : preview ? <><Pill tone={preview.drawn ? 'pink' : 'green'}>{preview.drawn ? 'EXCHANGE LOCKED' : 'INVITATIONS OPEN'}</Pill><h2>{preview.name}</h2><p className="join-event">{preview.concert_name}</p><div className="join-details"><span><CalendarDays size={18}/>{formatConcertDate(preview.concert_date)}</span><span><Users size={18}/>{preview.joined_count} / {preview.expected_members} registered</span></div><div className="join-explain"><LockKeyhole size={19}/><p>Once everyone joins, you&apos;ll get a secret person to make a custom concert tee for. Other participants, including the organizer, cannot see your match in the app.</p></div>{error && <Alert message={error}/>}<div className="join-actions">{authenticated ? <GlowButton onClick={join} loading={pending} >Join / open this exchange <ArrowRight size={17}/></GlowButton> : <><Link className="btn btn-primary full-width" href={`/auth?mode=signup&next=${encodeURIComponent(`/join/${invite}`)}`}>Sign up to join <ArrowRight size={17}/></Link><Link className="join-signin" href={`/auth?next=${encodeURIComponent(`/join/${invite}`)}`}>Already have an account? Log in</Link></>}</div>{preview.drawn && <p className="join-closed">The draw has been completed. Ask the organizer about next steps.</p>}{!preview.drawn && preview.joined_count >= preview.expected_members && <p className="join-closed">The crew is currently full. The organizer can increase the group size.</p>}</> : <Alert message={error || 'Unable to find this invitation.'}/>}</div>
  </div></div></main>;
}
