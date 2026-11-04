'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AuthGate } from '@/components/AuthGate';
import { GroupWorkspace } from '@/components/GroupWorkspace';
import { SpinnerPage } from '@/components/SpinnerPage';
import { Alert } from '@/components/ui';
import { api } from '@/lib/api';
import { friendlyError } from '@/lib/supabase';
import type { GroupDashboard } from '@/lib/types';

function GroupContent() {
  const {id} = useParams<{id:string}>();
  const [group, setGroup] = useState<GroupDashboard | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => { const data = await api.dashboard(id);setGroup(data);setError(''); }, [id]);
  useEffect(()=>{setLoading(true);refresh().catch(e=>setError(friendlyError(e))).finally(()=>setLoading(false));},[refresh]);
  useEffect(() => {
    const poll = () => { if (document.visibilityState === 'visible') void refresh().catch(e => {setError(friendlyError(e));setGroup(null);}); };
    const id = window.setInterval(poll, 30000);
    window.addEventListener('focus',poll);
    return () => {window.clearInterval(id);window.removeEventListener('focus',poll);};
  }, [refresh]);
  if (loading) return <SpinnerPage/>;
  if (error && !group) return <main className="center-layout"><div className="error-screen"><Alert message={error}/><a className="btn btn-secondary" href="/groups">Back to my groups</a></div></main>;
  if (!group) return <SpinnerPage/>;
  return <GroupWorkspace group={group}
    onSaveSize={async(size)=>{await api.setSize(id,size);await refresh();}}
    onGenerate={async()=>{await api.generateDraw(id);await refresh();}}
    onReset={async()=>{await api.resetDraw(id);await refresh();}}
    onUpdate={async(input)=>{await api.updateGroup(id,input);await refresh();}}
    onRemove={async(userId)=>{await api.removeMember(id,userId);await refresh();}}
    onDelete={async(confirmation)=>{await api.deleteGroup(id,confirmation);}}
    onReveal={()=>api.assignment(id)}
  />;
}

export default function GroupPage() {return <AuthGate>{() => <GroupContent />}</AuthGate>;}
