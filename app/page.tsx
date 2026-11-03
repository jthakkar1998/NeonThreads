'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, CalendarDays, Check, Gift, LockKeyhole, Menu, ShieldCheck, Shirt, Sparkles, Users, WandSparkles, Zap } from 'lucide-react';
import { Brand } from '@/components/ui';
import { isConfigured, supabase } from '@/lib/supabase';

const steps = [
  { icon: Users, number: '01', title: 'Assemble the crew', desc: 'Create your group, send the invite link, and watch your friends sign up.' },
  { icon: Shirt, number: '02', title: 'Pick your size', desc: 'Everybody saves their preferred tee size before the draw.' },
  { icon: Gift, number: '03', title: 'Draw secret names', desc: 'One click generates a private match for everyone. No awkward reciprocal pairs.' },
  { icon: Sparkles, number: '04', title: 'Bring the energy', desc: 'Create a custom shirt and reveal it with your crew at the show.' },
];

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (isConfigured()) supabase().auth.getSession().then(({data}) => setLoggedIn(Boolean(data.session)));
  }, []);
  return <div className="landing-wrap">
    <div className="landing-halo halo-one"/><div className="landing-halo halo-two"/>
    <header className="landing-header content-container">
      <Brand />
      <nav className={`landing-nav ${menuOpen ? 'mobile-open' : ''}`} aria-label="Main navigation">
        <a href="#how-it-works" onClick={()=>setMenuOpen(false)}>How it works</a>
        <Link href="/demo" onClick={()=>setMenuOpen(false)}>Live preview</Link>
        <Link href="/groups">My groups</Link>
      </nav>
      <div className="header-auth"><Link className="nav-login" href={loggedIn ? '/groups' : '/auth'}>{loggedIn ? 'Dashboard' : 'Log in'}</Link><Link className="btn btn-primary btn-small" href={loggedIn ? '/groups?create=1' : '/auth?mode=signup&next=%2Fgroups%3Fcreate%3D1'}>Get started <ArrowUpRight size={16}/></Link></div>
      <button type="button" className="mobile-menu-toggle" aria-label="Toggle menu" onClick={()=>setMenuOpen(v=>!v)}><Menu size={23}/></button>
    </header>

    <main>
      <section className="landing-hero content-container">
        <div className="hero-content">
          <div className="eyebrow hero-eyebrow"><span className="live-dot"/> FOR THE CREW. FOR THE CULTURE.</div>
          <h1>THE SECRET TEE<br/><span>EXCHANGE.</span></h1>
          <p className="hero-subtitle">One crew. One concert. Unforgettable shirts. Draw names in secret, create something ridiculous, and show up ready to rave.</p>
          <div className="hero-buttons"><Link href="/groups?create=1" className="btn btn-primary btn-large">Start an exchange <ArrowRight size={19}/></Link><Link href="/demo" className="btn btn-secondary btn-large">Explore the demo <ArrowUpRight size={18}/></Link></div>
          <div className="hero-points"><span><Check size={15}/>Secret assignments</span><span><Check size={15}/>Any size crew</span><span><Check size={15}/>Always saved</span></div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-stage"/>
          <div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/>
          <div className="hero-shirt"><span className="hero-shirt-glow"/><Shirt size={173} strokeWidth={1.1}/><Zap size={53} fill="currentColor" strokeWidth={1}/></div>
          <div className="float-card float-card-top"><span className="float-icon"><Users size={17}/></span><div><strong>CREW STATUS</strong><small>10 / 10 checked in</small></div><span className="float-check"><Check size={15}/></span></div>
          <div className="float-card float-card-bottom"><span className="float-icon pink"><LockKeyhole size={18}/></span><div><strong>YOUR MATCH IS SECRET</strong><small>Only you see your assignment</small></div></div>
        </div>
      </section>

      <section className="benefit-strip content-container" aria-label="Features">
        <div><ShieldCheck/><span><strong>PRIVATE BY DESIGN</strong><small>Your match is yours alone.</small></span></div>
        <div><WandSparkles/><span><strong>ZERO AWKWARD MATCHES</strong><small>No self-matches or mutual pairs.</small></span></div>
        <div><CalendarDays/><span><strong>THE COUNTDOWN IS ON</strong><small>Built around your big night.</small></span></div>
      </section>

      <section className="how-section content-container" id="how-it-works">
        <div className="section-eyebrow"><Sparkles size={15}/> YOUR NIGHT. YOUR RULES.</div>
        <h2>THE ROAD TO <em>THE DROP.</em></h2>
        <p>Four steps between your group chat and the shirt exchange of the year.</p>
        <div className="steps-grid">{steps.map(({icon: Icon, number, title, desc}) => <div key={number} className="step-card"><span className="step-num">{number}</span><span className="step-icon"><Icon size={28}/></span><h3>{title}</h3><p>{desc}</p></div>)}</div>
      </section>
      <section className="landing-cta content-container"><div className="cta-ambient"/><div className="cta-inner"><div className="section-eyebrow"><Zap size={15}/> LET'S MAKE SOME MEMORIES</div><h2>THE CREW IS WAITING.</h2><p>Start the draw. Keep the secret. Bring the chaos.</p><Link className="btn btn-primary btn-large" href="/groups?create=1">Create your group <ArrowRight size={19}/></Link></div></section>
    </main>
    <footer className="landing-footer content-container"><Brand /><span>MAKE IT LOUD. KEEP IT SECRET. © {new Date().getFullYear()}</span></footer>
  </div>;
}
