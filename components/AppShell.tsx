'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarDays, ChevronDown, CircleHelp, House, LogOut, Plus, Shirt, UserRound, X, Zap } from 'lucide-react';
import { Brand } from '@/components/ui';
import { api } from '@/lib/api';
import { friendlyError, isConfigured, supabase } from '@/lib/supabase';
import type { GroupSummary } from '@/lib/types';

type NavGroup = Pick<GroupSummary, 'id' | 'name'>;

type Props = {
  children: ReactNode;
  active?: 'groups' | 'profile' | 'group';
  groupId?: string;
  groupName?: string;
  demo?: boolean;
};

export function AppShell({ children, active = 'groups', groupId, groupName, demo = false }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [groups, setGroups] = useState<NavGroup[]>([]);
  const [navLoading, setNavLoading] = useState(!demo);
  const [navError, setNavError] = useState('');
  const [groupsExpanded, setGroupsExpanded] = useState(active === 'groups' || active === 'group');
  const [mobileGroupsOpen, setMobileGroupsOpen] = useState(false);

  // Refetch when navigating. This keeps the list up to date after creating or deleting a group.
  useEffect(() => {
    if (demo) { setNavLoading(false); return; }
    let cancelled = false;
    setNavLoading(true);
    setNavError('');
    api.myGroups()
      .then(result => { if (!cancelled) setGroups(result.map(({ id, name }) => ({ id, name }))); })
      .catch(error => { if (!cancelled) setNavError(friendlyError(error)); })
      .finally(() => { if (!cancelled) setNavLoading(false); });
    return () => { cancelled = true; };
  }, [demo, pathname]);

  useEffect(() => { if (groupId) setGroupsExpanded(true); }, [groupId]);
  useEffect(() => { setMobileGroupsOpen(false); }, [pathname]);
  useEffect(() => {
    if (!mobileGroupsOpen) return;
    const previous = document.body.style.overflow;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileGroupsOpen(false); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', onKeyDown); };
  }, [mobileGroupsOpen]);

  const baseGroups: NavGroup[] = demo ? [{ id: groupId || 'demo-group', name: groupName || 'Demo exchange' }] : groups;
  const visibleGroups = groupId && !baseGroups.some(g => g.id === groupId)
    ? [{ id: groupId, name: groupName || 'Current group' }, ...baseGroups]
    : baseGroups.map(g => g.id === groupId && groupName ? { ...g, name: groupName } : g);
  const groupOverviewUrl = demo ? '/demo' : '/groups';

  // The /groups page stays mounted when only the query string changes. Open its dialog immediately too.
  function openCreateOnCurrentPage() {
    if (pathname === '/groups') window.dispatchEvent(new Event('neonthreads:open-create-group'));
  }

  async function signOut() {
    if (isConfigured()) await supabase().auth.signOut();
    router.push('/');
    router.refresh();
  }

  function GroupLinks({ mobile = false }: { mobile?: boolean }) {
    return <>
      {navLoading && visibleGroups.length === 0 && <span className="nav-list-note">Loading your groups...</span>}
      {navError && visibleGroups.length === 0 && <span className="nav-list-note nav-list-error">Couldn't load groups. <Link href={groupOverviewUrl}>Open overview</Link></span>}
      {!navLoading && !navError && visibleGroups.length === 0 && <span className="nav-list-note">No groups yet. Start your first exchange!</span>}
      {visibleGroups.map(group => <Link
        key={group.id}
        href={demo ? '/demo' : `/groups/${group.id}`}
        onClick={mobile ? () => setMobileGroupsOpen(false) : undefined}
        className={`side-group-link ${groupId === group.id ? 'is-active' : ''}`}
        aria-current={groupId === group.id ? 'page' : undefined}
        title={group.name}
      ><Shirt size={16}/><span className="side-group-name">{group.name}</span></Link>)}
      {!demo && <Link href="/groups?create=1" className="side-group-create" onClick={() => { if (mobile) setMobileGroupsOpen(false); openCreateOnCurrentPage(); }}><Plus size={16}/> Create new group</Link>}
    </>;
  }

  return <div className="app-layout">
    <aside className="sidebar">
      <div className="side-brand"><Brand /></div>
      <div className="side-kicker">YOUR SPACE</div>
      <nav className="side-menu" aria-label="Dashboard navigation">
        <div className={`side-group-parent ${active === 'group' ? 'has-active-group' : ''}`}>
          <Link href={groupOverviewUrl} className={`side-link side-parent-link ${active === 'groups' ? 'selected' : ''}`}><House size={18}/>My groups</Link>
          <button type="button" className={`side-group-toggle ${groupsExpanded ? 'expanded' : ''}`} aria-expanded={groupsExpanded} aria-controls="sidebar-group-list" aria-label={`${groupsExpanded ? 'Collapse' : 'Expand'} My groups`} onClick={() => setGroupsExpanded(v => !v)}><ChevronDown size={17}/></button>
        </div>
        {groupsExpanded && <div id="sidebar-group-list" className="side-group-list"><GroupLinks /></div>}
        <Link href={demo ? '/demo' : '/profile'} className={`side-link ${active === 'profile' ? 'selected' : ''}`}><UserRound size={18}/>Profile</Link>
      </nav>
      <div className="sidebar-bottom">
        <div className="side-eq" aria-hidden="true">{[14,27,41,21,54,35,17,31,49,25,37,14].map((h,i)=><i key={i} style={{height:h}} />)}</div>
        <div className="side-tip"><Zap size={16}/>Made for the afterglow.</div>
        {demo ? <Link href="/" className="side-link"><CircleHelp size={17}/>Back to home</Link> : <button type="button" onClick={signOut} className="side-link side-action"><LogOut size={17}/>Sign out</button>}
      </div>
    </aside>
    <div className="app-main">
      <header className="app-topbar">
        <div className="mobile-logo"><Brand compact /></div>
        <div className="topbar-breadcrumb"><span>NEON THREADS</span><span className="crumb-divider">/</span><strong title={groupName || 'My groups'}>{groupName || (active === 'profile' ? 'Profile' : 'My groups')}</strong></div>
        <div className="topbar-actions"><span className="topbar-live"><i/> THE CREW IS LIVE</span><Link href={demo ? '/demo' : '/profile'} className="user-bubble" aria-label="Profile"><UserRound size={18}/></Link></div>
      </header>
      <main className="app-content">{children}</main>
      <footer className="app-footer"><span>NEON THREADS © {new Date().getFullYear()}</span><span><CalendarDays size={13}/>The best nights make stories.</span></footer>
      {mobileGroupsOpen && <>
        <div className="mobile-groups-backdrop" aria-hidden="true" onClick={() => setMobileGroupsOpen(false)}/>
        <section id="mobile-groups-menu" className="mobile-groups-sheet" aria-label="My groups menu">
          <div className="mobile-groups-head"><div><strong>My groups</strong><span>Switch between your exchanges</span></div><button type="button" aria-label="Close groups menu" onClick={() => setMobileGroupsOpen(false)}><X size={19}/></button></div>
          <div className="mobile-groups-list"><Link href={groupOverviewUrl} className={`mobile-groups-overview ${active === 'groups' ? 'is-active' : ''}`} onClick={() => setMobileGroupsOpen(false)}><House size={17}/>View all groups</Link><GroupLinks mobile /></div>
        </section>
      </>}
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <button type="button" className={active === 'groups' || active === 'group' || mobileGroupsOpen ? 'active' : ''} onClick={() => setMobileGroupsOpen(v => !v)} aria-expanded={mobileGroupsOpen} aria-controls="mobile-groups-menu"><House size={19}/><span>Groups</span></button>
        {!demo && <Link href="/groups?create=1" onClick={openCreateOnCurrentPage}><Plus size={19}/><span>Create</span></Link>}
        <Link href={demo ? '/demo' : '/profile'} className={active==='profile' ? 'active' : ''}><UserRound size={19}/><span>Profile</span></Link>
        {demo ? <Link href="/"><LogOut size={19}/><span>Exit demo</span></Link> : <button type="button" onClick={signOut}><LogOut size={19}/><span>Sign out</span></button>}
      </nav>
    </div>
  </div>;
}
