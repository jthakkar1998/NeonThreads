'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowUpRight, CalendarDays, Check, CirclePlus, Gift, Plus, Shirt, Sparkles, Users, X } from 'lucide-react';
import { AuthGate } from '@/components/AuthGate';
import { AppShell } from '@/components/AppShell';
import { Alert, ConcertDateInput, GlowButton, InputField, PageHeading, Pill } from '@/components/ui';
import { api } from '@/lib/api';
import { formatConcertDate } from '@/lib/date';
import { friendlyError } from '@/lib/supabase';
import type { GroupInput, GroupSummary } from '@/lib/types';

const defaults: GroupInput = { name: '', concert_name: '', concert_date: '', venue: '', expected_members: 10 };

function GroupsContent() {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState(false);
  const [input, setInput] = useState<GroupInput>({ ...defaults });
  const [error, setError] = useState('');
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setCreating(q.has('create'));
    api.myGroups().then(setGroups).catch(err=>setError(friendlyError(err))).finally(()=>setLoading(false));
    const openCreateFromNav = () => setCreating(true);
    window.addEventListener('neonthreads:open-create-group', openCreateFromNav);
    return () => window.removeEventListener('neonthreads:open-create-group', openCreateFromNav);
  }, []);
  function closeModal() {
    setCreating(false); setError('');
    if (window.location.search) window.history.replaceState({}, '', '/groups');
  }
  async function create(e: FormEvent) {
    e.preventDefault(); setPending(true); setError('');
    try {
      const id = await api.createGroup(input);
      router.push(`/groups/${id}`);
    } catch (err) { setError(friendlyError(err)); }
    finally { setPending(false); }
  }
  return <AppShell active="groups"><PageHeading eyebrow="YOUR RAVE UNIVERSE" title="My groups" description="Every crew, every show, every legendary shirt exchange."><GlowButton onClick={()=>setCreating(true)}><Plus size={17}/> Create a group</GlowButton></PageHeading>
    <div className="group-overview"><div className="overview-big"><div className="eyebrow"><Sparkles size={15}/> READY FOR YOUR NEXT ADVENTURE?</div><h2>GREAT NIGHTS START<br/><em>WITH THE CREW.</em></h2><p>Get everyone together, make a draw, and start designing the most unhinged tees of the night.</p><GlowButton onClick={()=>setCreating(true)}>Start a new exchange <ArrowRight size={18}/></GlowButton></div><div className="overview-image"/></div>
    <div className="section-line"><h3>Your exchanges <span>{groups.length}</span></h3><span>{loading ? 'Loading...' : 'Find your crew below'}</span></div>
    {error && !creating && <Alert message={error}/>}
    {loading ? <div className="skeleton-grid"><div/><div/></div> : groups.length ? <div className="groups-grid">
      {groups.map(g => <Link key={g.id} href={`/groups/${g.id}`} className="group-card"><div className="group-card-visual"><div className="group-card-icon"><Shirt size={24}/></div><Pill tone={g.drawn_at ? 'green' : 'purple'}>{g.drawn_at ? 'DRAW COMPLETE' : 'WAITING FOR CREW'}</Pill></div><div className="group-card-body"><span className="overline">{g.concert_name}</span><h3>{g.name}</h3><p><CalendarDays size={15}/>{formatConcertDate(g.concert_date)}</p><div className="group-card-progress"><div><Users size={15}/> {g.joined_count}/{g.expected_members} registered</div><div><Shirt size={15}/> {g.sizes_ready} sizes submitted</div></div><div className="progress-track"><div style={{width: `${100*g.joined_count/g.expected_members}%`}}/></div><span className="group-card-enter">Open dashboard <ArrowUpRight size={17}/></span></div></Link>)}
    </div> : <div className="no-groups"><Gift size={33}/><h3>No exchanges yet</h3><p>Create your first group, then share the invitation with your friends.</p><GlowButton onClick={()=>setCreating(true)}><CirclePlus size={17}/> Create first group</GlowButton></div>}
    {creating && <div className="modal-backdrop" role="presentation" onClick={closeModal}><section className="modal create-modal" role="dialog" aria-modal="true" aria-labelledby="create-title" onClick={e=>e.stopPropagation()}><div className="modal-top"><div><span className="eyebrow">NEW ADVENTURE UNLOCKED</span><h2 id="create-title">Create your exchange</h2><p>Start a crew. You can edit these details later.</p></div><button type="button" aria-label="Close" className="icon-button" onClick={closeModal}><X size={20}/></button></div>
      <form onSubmit={create} className="form-stack"><InputField label="Group name"><input required maxLength={80} minLength={2} placeholder="e.g. The Rave Crew" value={input.name} onChange={e=>setInput(p=>({...p,name:e.target.value}))}/></InputField><InputField label="Concert / festival"><input required maxLength={100} minLength={2} placeholder="e.g. Beyond Wonderland" value={input.concert_name} onChange={e=>setInput(p=>({...p,concert_name:e.target.value}))}/></InputField><div className="two-col-fields"><InputField label="Concert date"><ConcertDateInput required value={input.concert_date} onChange={e=>setInput(p=>({...p,concert_date:e.target.value}))}/></InputField><InputField label="Expected group size" hint="You can change this later."><input required type="number" min={3} max={200} value={input.expected_members} onChange={e=>setInput(p=>({...p,expected_members:Number(e.target.value)}))}/></InputField></div><InputField label="Venue (optional)"><input maxLength={120} placeholder="Where the magic happens" value={input.venue} onChange={e=>setInput(p=>({...p,venue:e.target.value}))}/></InputField><div className="create-note"><Check size={16}/>You will automatically join as the organizer.</div>{error && <Alert message={error}/>}<GlowButton type="submit" loading={pending} className="full-width">Create group <ArrowRight size={17}/></GlowButton></form>
    </section></div>}
  </AppShell>;
}

export default function GroupsPage() { return <AuthGate>{()=> <GroupsContent/>}</AuthGate>; }
