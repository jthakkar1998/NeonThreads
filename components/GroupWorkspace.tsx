'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Check, CheckCheck, ChevronDown, CircleAlert, Copy, Crown, Gift, Heart, LockKeyhole, Minus, Plus, RotateCcw, Settings, ShieldCheck, Shirt, Shuffle, Sparkles, Ticket, Trash2, Users, X, Zap } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { ExchangeRules } from '@/components/ExchangeRules';
import { Alert, GlowButton, InputField, Pill } from '@/components/ui';
import { daysUntil, formatConcertDate } from '@/lib/date';
import { friendlyError } from '@/lib/supabase';
import type { Assignment, GroupDashboard, GroupInput, ShirtSize } from '@/lib/types';
import { SHIRT_SIZES } from '@/lib/types';

type Props = {
  group: GroupDashboard;
  demo?: boolean;
  onSaveSize: (size: ShirtSize) => Promise<void>;
  onGenerate: () => Promise<void>;
  onReset: () => Promise<void>;
  onUpdate: (input: GroupInput) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
  onDelete: (confirmation: string) => Promise<void>;
  onReveal: () => Promise<Assignment | null>;
};
type Tab = 'dashboard' | 'assignment' | 'settings';
type Confirmation = { kind: 'draw' | 'reset' | 'remove' | 'delete'; userId?: string; name?: string } | null;

function initials(name: string): string { return name.split(' ').filter(Boolean).slice(0, 2).map(w=>w[0].toUpperCase()).join('') || '?'; }

export function GroupWorkspace({ group, demo = false, onSaveSize, onGenerate, onReset, onUpdate, onRemove, onDelete, onReveal }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [size, setSize] = useState<ShirtSize>(group.my_size || 'M');
  const [settings, setSettings] = useState<GroupInput>({name:group.name,concert_name:group.concert_name,concert_date:group.concert_date,venue:group.venue||'',expected_members:group.expected_members});
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirm, setConfirm] = useState<Confirmation>(null);
  const [resetText, setResetText] = useState('');
  const [deleteText, setDeleteText] = useState('');
  const [mounted, setMounted] = useState(false);
  const [origin, setOrigin] = useState('');
  const [today, setToday] = useState(() => new Date());
  useEffect(() => { setSize(group.my_size || 'M'); }, [group.my_size]);
  useEffect(() => { setSettings({name:group.name,concert_name:group.concert_name,concert_date:group.concert_date,venue:group.venue||'',expected_members:group.expected_members}); }, [group.id,group.name,group.concert_name,group.concert_date,group.venue,group.expected_members]);
  useEffect(() => { setAssignment(null); }, [group.drawn_at, group.id]);
  useEffect(() => { setMounted(true); setOrigin(window.location.origin); const i = window.setInterval(()=>setToday(new Date()), 60000); return ()=>window.clearInterval(i); }, []);
  void today;
  const isDrawn = !!group.drawn_at;
  const allJoined = group.joined_count === group.expected_members;
  const sizesReady = group.sizes_ready === group.joined_count;
  const ready = !isDrawn && group.joined_count >= 3 && allJoined && sizesReady;
  const joinPercentage = Math.min(100, (group.joined_count / group.expected_members)*100);
  const leftToJoin = group.expected_members - group.joined_count;
  const dateDays = mounted ? daysUntil(group.concert_date) : null;

  async function act(label: string, promise: () => Promise<void>, done?: () => void, message?: string) {
    setBusy(label);setError('');setSuccess('');
    try {await promise();setSuccess(message || 'Changes saved.');done?.();} catch (err) {setError(friendlyError(err));}
    finally {setBusy('');setConfirm(null);setResetText('');setDeleteText('');}
  }

  async function reveal() {
    setBusy('reveal');setError('');
    try { const found = await onReveal();if (!found) throw new Error('Your assignment is not available yet.');setAssignment(found); }
    catch (err) {setError(friendlyError(err));} finally {setBusy('');}
  }

  async function copyInvite() {
    if (!group.invite_code) return;
    if (demo) {setSuccess('Demo preview: invitation sharing is enabled in your real group.');return;}
    try {await navigator.clipboard.writeText(`${window.location.origin}/join/${group.invite_code}`);setSuccess('Invitation link copied! Send it to your crew.');setError('');}
    catch {setError('Could not copy automatically. Select and copy the invitation URL from the field above.');}
  }

  return <AppShell active="group" groupName={group.name} groupId={demo ? undefined : group.id} demo={demo}>
    {demo && <div className="demo-ribbon"><Sparkles size={17}/><span><strong>DESIGN PREVIEW</strong> — Sample group and members. Changes here are not saved to a database.</span><a href="/groups">Create a real group <ArrowUpRight size={15}/></a></div>}
    <div className="group-back"><button type="button" onClick={()=>router.push(demo ? '/' : '/groups')}><ArrowLeft size={15}/> {demo ? 'Back to homepage' : 'All groups'}</button></div>
    <div className="event-banner"><div className="event-banner-cover"/><div className="event-banner-shade"/>
      <div className="event-banner-left"><div className="eyebrow"><span className="live-dot"/> THE OFFICIAL CREW HUB</div><h1>{group.name}</h1><div className="event-tags"><span><CalendarDays size={16}/>{formatConcertDate(group.concert_date)}</span>{group.venue && <span><Ticket size={16}/>{group.venue}</span>}</div></div>
      <div className="banner-countdown"><span>DAYS UNTIL THE DROP</span><div><strong>{dateDays === null ? '—' : dateDays}</strong><Zap size={27}/></div><small>{dateDays===0 ? 'IT IS SHOWTIME!' : 'THE COUNTDOWN IS ON'}</small></div>
    </div>

    <div className="tabs" role="tablist" aria-label="Group sections">
      <button type="button" role="tab" aria-selected={tab==='dashboard'} className={tab==='dashboard' ? 'active' : ''} onClick={()=>{setTab('dashboard');setError('');}}><Users size={18}/> Group dashboard</button>
      <button type="button" role="tab" aria-selected={tab==='assignment'} className={tab==='assignment' ? 'active' : ''} onClick={()=>{setTab('assignment');setError('');}}><Gift size={18}/> My assignment {isDrawn && <span className="tab-ping"/>}</button>
      {group.is_organizer && <button type="button" role="tab" aria-selected={tab==='settings'} className={tab==='settings' ? 'active' : ''} onClick={()=>{setTab('settings');setError('');}}><Settings size={17}/> Group settings</button>}
    </div>

    {error && <div className="workspace-alert"><Alert message={error} onClose={()=>setError('')}/></div>}
    {success && <div className="workspace-alert"><Alert tone="success" message={success} onClose={()=>setSuccess('')}/></div>}

    {tab === 'dashboard' && <div className="dashboard-stack">
      <ExchangeRules/>
      <div className="dashboard-intro"><div><div className="section-eyebrow"><Sparkles size={15}/> GOOD VIBES, GREAT SHIRTS</div><h2>{isDrawn ? 'The secret is out. (Kind of.)' : 'Your crew is coming together.'}</h2><p>{isDrawn ? 'Assignments are locked in. Check your own match and get designing.' : 'Once everyone checks in and chooses a shirt size, the secret draw begins.'}</p></div><Pill tone={isDrawn ? 'green' : 'purple'}>{isDrawn ? 'ASSIGNMENTS SENT' : 'COLLECTING THE CREW'}</Pill></div>
      <div className="dashboard-top-grid">
        <section className="panel status-panel"><div className="panel-label"><span><Users size={21}/> REGISTRATION PROGRESS</span><span className="stat-fraction">{group.joined_count}<small>/{group.expected_members}</small></span></div>
          <div className="progress-track large"><div style={{width:`${joinPercentage}%`}}/></div>
          <div className="registration-stats"><span><Check size={16}/> {group.joined_count} registered</span><span><Shirt size={16}/> {group.sizes_ready} sizes ready</span></div>
          <div className="status-foot">{allJoined ? <><CheckCheck size={18}/><span>Everyone has registered{sizesReady ? ' and submitted their size!' : '. Waiting on shirt sizes.'}</span></> : <><CircleAlert size={18}/><span>{leftToJoin} {leftToJoin === 1 ? 'spot' : 'spots'} remaining — share the invitation link.</span></>}</div>
        </section>
        <section className="panel draw-panel"><div className="panel-label"><span><Shuffle size={21}/> THE SECRET DRAW</span>{isDrawn ? <Pill tone="green">COMPLETE</Pill> : <Pill tone={ready ? 'cyan' : 'muted'}>{ready ? 'READY TO DRAW' : 'NOT READY'}</Pill>}</div>
          <div className="draw-status-icon"><span><Shirt size={25}/></span><div><strong>{isDrawn ? 'The assignments are in!' : ready ? 'Your crew is ready!' : 'Almost party time...'}</strong><small>{isDrawn ? 'See who you are making a shirt for.' : ready ? 'Every shirt size is set. Time to get shuffling.' : `${group.joined_count} / ${group.expected_members} members · ${group.sizes_ready} sizes`}</small></div></div>
          {isDrawn ? <GlowButton className="full-width" onClick={()=>setTab('assignment')}><Gift size={18}/> View my assignment <ArrowRight size={17}/></GlowButton> : group.is_organizer ? <GlowButton className="full-width" disabled={!ready} onClick={()=>setConfirm({kind:'draw'})}><Shuffle size={18}/> Generate assignments <ArrowRight size={17}/></GlowButton> : <div className="draw-waiting"><LockKeyhole size={17}/> Your organizer will draw when everyone is ready.</div>}
        </section>
      </div>
      <div className="dashboard-bottom-grid">
        <section className="panel roster-panel"><div className="panel-heading roster-heading"><div className="heading-left"><span className="panel-icon"><Users size={22}/></span><div><h2>Your people <small>({group.joined_count})</small></h2><p>Everyone who has joined your exchange.</p></div></div><Pill tone="cyan">{group.joined_count} / {group.expected_members} JOINED</Pill></div>
          <div className="roster-column-head"><span>MEMBER</span><span>SHIRT SIZE STATUS</span></div>
          <div className="roster-list">{group.members.map((m,i)=><div key={m.user_id} className="roster-row"><div className="member-identity"><span className={`member-avatar avatar-${i%6}`}>{initials(m.display_name)}</span><div><strong>{m.display_name} {m.is_me && <span className="you-label">(You)</span>}</strong><span className="member-flags">{m.is_organizer && <><Crown size={12}/> Organizer</>}</span></div></div><span className={`size-status ${m.size_submitted ? 'is-ready' : ''}`}>{m.size_submitted ? <><Check size={15}/> Size submitted</> : <><CircleAlert size={15}/> Not submitted</>}</span></div>)}</div>
          {group.joined_count < group.expected_members && <div className="empty-roster-spots"><Users size={16}/>{leftToJoin} {leftToJoin === 1 ? 'open spot' : 'open spots'} for the rest of the crew</div>}
        </section>
        <div className="right-stack"><section className="panel my-size-panel"><div className="panel-heading"><div className="heading-left"><span className="panel-icon pink-icon"><Shirt size={22}/></span><div><h2>Your shirt size</h2><p>Make it easy for your mystery gifter.</p></div></div></div>
          <div className="size-input-wrap"><label htmlFor="my-shirt-size">Preferred unisex tee size</label><div className="select-wrap"><select id="my-shirt-size" value={size} onChange={e=>setSize(e.target.value as ShirtSize)}>{SHIRT_SIZES.map(s=><option key={s} value={s}>{s}</option>)}</select><ChevronDown size={16}/></div></div>
          <GlowButton variant="secondary" className="full-width" loading={busy==='size'} disabled={busy!==''} onClick={()=>act('size',()=>onSaveSize(size),undefined,'Your shirt size was saved!')}>{group.my_size ? 'Update my size' : 'Save my size'} <ArrowRight size={17}/></GlowButton><p className="size-privacy"><LockKeyhole size={14}/> Your selected size will be visible to whoever draws you.</p>
        </section>
          {group.is_organizer && <section className="panel invite-panel"><div className="panel-heading"><div className="heading-left"><span className="panel-icon cyan-icon"><ArrowUpRight size={23}/></span><div><h2>Invite your crew</h2><p>Share this link to get everyone in.</p></div></div></div>
            <input className="invite-code invite-input" readOnly aria-label="Invitation link" value={demo ? 'Demo only — create a real group to invite friends' : origin ? `${origin}/join/${group.invite_code}` : ''} onFocus={e=>e.currentTarget.select()}/><GlowButton variant="secondary" className="full-width" onClick={copyInvite}><Copy size={16}/> Copy invitation link</GlowButton>
          </section>}
          <section className="mini-info"><ShieldCheck size={22}/><div><strong>THE SECRET STAYS SECRET.</strong><span>Even the organizer cannot view other members&apos; matches through the app.</span></div></section>
        </div>
      </div>
    </div>}

    {tab === 'assignment' && <div className="assignment-layout"><div className="assignment-head"><div className="section-eyebrow"><Gift size={15}/> THE MOMENT OF TRUTH</div><h2>Your secret assignment</h2><p>One person. One shirt. Unlimited creative freedom.</p></div>
      {!isDrawn ? <div className="assignment-card locked-card"><div className="assignment-rays"/><div className="big-gift"><LockKeyhole size={52}/></div><Pill tone="pink">THE DRAW HASN'T HAPPENED YET</Pill><h3>THE SECRET IS STILL SEALED.</h3><p>Once the whole crew registers and submits shirt sizes, the organizer can draw names. Your match will appear right here.</p><GlowButton variant="secondary" onClick={()=>setTab('dashboard')}>Back to dashboard <ArrowRight size={17}/></GlowButton></div>
      : !assignment ? <div className="assignment-card reveal-card"><div className="assignment-rays"/><div className="big-gift"><Gift size={58}/></div><div className="eyebrow">YOUR DESTINY AWAITS</div><h3>READY TO FIND<br/>YOUR PERSON?</h3><p>Your match is private, permanently saved, and waiting behind this button.</p><GlowButton onClick={reveal} loading={busy==='reveal'} className="reveal-button"><Sparkles size={19}/> Reveal my assignment <ArrowRight size={18}/></GlowButton><span className="reveal-note"><LockKeyhole size={15}/> Only you can reveal your recipient.</span></div>
      : <div className="assignment-card revealed-card"><div className="assignment-rays"/><div className="reveal-sparks"><Sparkles size={30}/><Heart size={25}/><Zap size={28}/></div><div className="eyebrow">THE UNIVERSE HAS SPOKEN</div><h3>YOU'RE MAKING A SHIRT FOR</h3><div className="recipient-name">{assignment.recipient_name}</div><div className="recipient-size"><Shirt size={23}/><span>THEIR T-SHIRT SIZE</span><strong>{assignment.recipient_size || 'Size pending'}</strong></div><p>Now make it unforgettable. Keep the reveal for the concert!</p><span className="reveal-note"><LockKeyhole size={15}/> This assignment stays saved. Come back any time.</span></div>}
      <aside className="assignment-side"><div className="panel"><div className="panel-heading"><span className="panel-icon"><ShieldCheck size={22}/></span><div><h2>Just between us</h2><p>Private by design.</p></div></div><p>Every member receives exactly one person to shop for. No one draws themselves, and two people can&apos;t draw each other.</p></div><div className="panel assignment-tee"><div className="big-neon-tee"><Shirt size={68}/></div><strong>THE VIBE?</strong><span>Make it weird. Make it personal. Keep it within $25–$40.</span></div></aside>
    </div>}

    {tab === 'settings' && group.is_organizer && <div className="settings-layout"><div className="settings-intro"><div className="section-eyebrow"><Settings size={15}/> ORGANIZER CONTROL ROOM</div><h2>Group settings</h2><p>Keep the details current as plans come together.</p></div>
      <div className="settings-grid"><section className="panel"><div className="panel-heading"><span className="panel-icon"><Settings size={22}/></span><div><h2>Event details</h2><p>Adjust these settings whenever your plans change.</p></div></div><div className="form-stack"><InputField label="Group name"><input maxLength={80} minLength={2} value={settings.name} onChange={e=>setSettings(p=>({...p,name:e.target.value}))}/></InputField><InputField label="Concert / festival"><input maxLength={100} minLength={2} value={settings.concert_name} onChange={e=>setSettings(p=>({...p,concert_name:e.target.value}))}/></InputField><InputField label="Concert date"><input type="date" value={settings.concert_date} onChange={e=>setSettings(p=>({...p,concert_date:e.target.value}))}/></InputField><InputField label="Venue (optional)"><input maxLength={120} value={settings.venue} onChange={e=>setSettings(p=>({...p,venue:e.target.value}))}/></InputField><div className="group-size-editor"><div><strong>Expected group size</strong><small>{isDrawn ? 'Reset the draw to unlock group size.' : `Cannot go below ${group.joined_count} registered members.`}</small></div><div className="number-stepper"><button disabled={isDrawn || settings.expected_members<=Math.max(3,group.joined_count)} aria-label="Decrease group size" type="button" onClick={()=>setSettings(p=>({...p,expected_members:p.expected_members-1}))}><Minus size={17}/></button><span>{settings.expected_members}</span><button disabled={isDrawn || settings.expected_members>=200} aria-label="Increase group size" type="button" onClick={()=>setSettings(p=>({...p,expected_members:p.expected_members+1}))}><Plus size={17}/></button></div></div><GlowButton loading={busy==='update'} disabled={busy!==''} onClick={()=>act('update',()=>onUpdate(settings),undefined,'Group settings have been updated!')}>Save event settings <Check size={18}/></GlowButton></div></section>
      <div className="settings-side"><section className="panel"><div className="panel-heading"><span className="panel-icon cyan-icon"><Users size={22}/></span><div><h2>Manage members</h2><p>{isDrawn ? 'Unlock the draw first to edit the crew.' : 'Remove anyone who is no longer attending.'}</p></div></div><div className="settings-member-list">{group.members.map(m=><div key={m.user_id}><div className="settings-member-name"><span className="tiny-avatar">{initials(m.display_name)}</span><span>{m.display_name}</span>{m.is_organizer && <Crown size={14}/>}</div>{!m.is_organizer && <button type="button" className="remove-member" disabled={isDrawn || busy!==''} title="Remove member" onClick={()=>setConfirm({kind:'remove',userId:m.user_id,name:m.display_name})}><Trash2 size={16}/></button>}</div>)}</div></section><section className="panel danger-panel"><div className="panel-heading"><span className="panel-icon danger-icon"><RotateCcw size={21}/></span><div><h2>Reset assignments</h2><p>Danger zone</p></div></div><p>Deletes everyone&apos;s secret match. Their accounts, shirt sizes, and group membership will stay intact.</p><GlowButton variant="danger" disabled={!isDrawn || busy!==''} onClick={()=>setConfirm({kind:'reset'})}><RotateCcw size={17}/> Reset the entire draw</GlowButton></section>
        <section className="panel danger-panel delete-group-panel">
          <div className="panel-heading"><span className="panel-icon danger-icon"><Trash2 size={21}/></span><div><h2>Delete group</h2><p>Permanent action</p></div></div>
          <p>Done with a test exchange? Permanently delete this group, its memberships and assignments. Your accounts and other groups will not be affected.</p>
          <GlowButton variant="danger" disabled={busy!==''} onClick={()=>{setDeleteText('');setConfirm({kind:'delete'});}}><Trash2 size={17}/> Delete this group</GlowButton>
          <div className="delete-warning"><CircleAlert size={15}/> This cannot be undone, even if the draw has already happened.</div>
        </section>
      </div></div>
    </div>}

    {confirm && <div className="modal-backdrop" role="presentation" onClick={()=>{if(!busy)setConfirm(null);}}>
      <div className="modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={e=>e.stopPropagation()}>
        <button type="button" disabled={!!busy} onClick={()=>setConfirm(null)} className="modal-x" aria-label="Close"><X size={19}/></button>
        <span className={`confirm-icon ${confirm.kind==='reset' || confirm.kind==='delete' ? 'danger' : ''}`}>
          {confirm.kind==='reset' ? <RotateCcw size={30}/> : confirm.kind==='remove' || confirm.kind==='delete' ? <Trash2 size={30}/> : <Shuffle size={30}/>}
        </span>
        <h2 id="confirm-title">
          {confirm.kind==='draw' ? 'Ready to draw names?' :
           confirm.kind==='reset' ? 'Reset every assignment?' :
           confirm.kind==='delete' ? 'Delete this group forever?' : `Remove ${confirm.name}?`}
        </h2>
        <p>
          {confirm.kind==='draw' ? 'This will give every member one private recipient. No self-assignments or two-way pairs. The group will lock after drawing.' :
           confirm.kind==='reset' ? 'Every current match will be permanently cleared. Anyone who has already viewed their recipient could be affected. You will need to generate a new draw.' :
           confirm.kind==='delete' ? 'This permanently deletes this exchange, its invitation, memberships and assignments for everyone. It does not delete login accounts or other groups. There is no undo.' :
           'This member will lose access to the group. You can invite them again before drawing.'}
        </p>
        {confirm.kind==='reset' && <InputField label="Type RESET to confirm"><input value={resetText} onChange={e=>setResetText(e.target.value)} autoComplete="off" placeholder="RESET"/></InputField>}
        {confirm.kind==='delete' && <>
          <p className="delete-instructions">Type the exact group name to confirm: <strong className="delete-confirm-name">{group.name}</strong></p>
          <InputField label="Group name"><input value={deleteText} onChange={e=>setDeleteText(e.target.value)} autoComplete="off" autoFocus placeholder={group.name}/></InputField>
        </>}
        <div className="modal-actions">
          <GlowButton variant="secondary" disabled={!!busy} onClick={()=>setConfirm(null)}>Cancel</GlowButton>
          <GlowButton variant={confirm.kind==='reset' || confirm.kind==='remove' || confirm.kind==='delete' ? 'danger' : 'primary'}
            loading={busy==='confirm'}
            disabled={!!busy || (confirm.kind==='reset' && resetText!=='RESET') || (confirm.kind==='delete' && deleteText!==group.name)}
            onClick={()=>act('confirm',
              confirm.kind==='draw' ? onGenerate :
              confirm.kind==='reset' ? onReset :
              confirm.kind==='remove' ? ()=>onRemove(confirm.userId!) :
              ()=>onDelete(deleteText),
              ()=>{if(confirm.kind==='draw')setTab('assignment');else if(confirm.kind==='reset'){setTab('dashboard');setAssignment(null);}else if(confirm.kind==='delete')router.replace('/groups');},
              confirm.kind==='draw' ? 'Draw complete! Everyone now has a secret assignment.' :
              confirm.kind==='reset' ? 'All assignments have been cleared.' :
              confirm.kind==='delete' ? 'The group has been permanently deleted.' : `${confirm.name} was removed from the group.`
            )}>
            {confirm.kind==='draw' ? 'Generate the draw' : confirm.kind==='reset' ? 'Reset assignments' : confirm.kind==='delete' ? 'Permanently delete group' : 'Remove member'} <ArrowRight size={17}/>
          </GlowButton>
        </div>
      </div>
    </div>}
  </AppShell>;
}
