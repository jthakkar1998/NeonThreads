'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, CircleHelp, House, LogOut, Plus, Settings, Shirt, UserRound, Zap } from 'lucide-react';
import { Brand } from '@/components/ui';
import { isConfigured, supabase } from '@/lib/supabase';

export function AppShell({ children, active = 'groups', groupId, groupName, demo = false }: { children: ReactNode; active?: 'groups' | 'profile' | 'group'; groupId?: string; groupName?: string; demo?: boolean }) {
  const router = useRouter();
  async function signOut() {
    if (isConfigured()) await supabase().auth.signOut();
    router.push('/');
    router.refresh();
  }
  return <div className="app-layout">
    <aside className="sidebar">
      <div className="side-brand"><Brand /></div>
      <div className="side-kicker">YOUR SPACE</div>
      <nav className="side-menu" aria-label="Dashboard navigation">
        <Link href={demo ? '/demo' : '/groups'} className={`side-link ${active === 'groups' || active === 'group' ? 'selected' : ''}`}><House size={18}/>My groups</Link>
        {!demo && <Link href="/groups?create=1" className="side-link"><Plus size={18}/>Create group</Link>}
        {groupId && <Link href={`/groups/${groupId}`} className="side-link subnav"><Shirt size={17}/><span className="truncate">{groupName || 'Group dashboard'}</span></Link>}
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
        <div className="topbar-breadcrumb"><span>NEON THREADS</span><span className="crumb-divider">/</span><strong>{groupName || 'My groups'}</strong></div>
        <div className="topbar-actions"><span className="topbar-live"><i/> THE CREW IS LIVE</span><Link href={demo ? '/demo' : '/profile'} className="user-bubble" aria-label="Profile"><UserRound size={18}/></Link></div>
      </header>
      <main className="app-content">{children}</main>
      <footer className="app-footer"><span>NEON THREADS © {new Date().getFullYear()}</span><span><CalendarDays size={13}/>The best nights make stories.</span></footer>
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <Link href={demo ? '/demo' : '/groups'} className={active==='groups' || active==='group' ? 'active' : ''}><House size={19}/><span>Groups</span></Link>
        {!demo && <Link href="/groups?create=1"><Plus size={19}/><span>Create</span></Link>}
        <Link href={demo ? '/demo' : '/profile'} className={active==='profile' ? 'active' : ''}><UserRound size={19}/><span>Profile</span></Link>
        {demo ? <Link href="/"><LogOut size={19}/><span>Exit demo</span></Link> : <button type="button" onClick={signOut}><LogOut size={19}/><span>Sign out</span></button>}
      </nav>
    </div>
  </div>;
}
