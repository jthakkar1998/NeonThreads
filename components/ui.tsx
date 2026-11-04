'use client';

import type { ButtonHTMLAttributes, ChangeEventHandler, ReactNode } from 'react';
import Link from 'next/link';
import { Activity, ArrowUpRight, CalendarDays, LoaderCircle, Sparkles, Shirt, Zap } from 'lucide-react';
import { formatConcertDate } from '@/lib/date';

export function Brand({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="brand-lockup" aria-label="Neon Threads home">
    <span className="brand-emblem"><Activity size={24} strokeWidth={2.4} /></span>
    {!compact && <span className="brand-wordmark">NEON<span>THREADS</span><small>SECRET TEE EXCHANGE</small></span>}
  </Link>;
}

export function Pill({ children, tone = 'purple' }: { children: ReactNode; tone?: 'purple' | 'cyan' | 'green' | 'pink' | 'muted' }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

export function GlowButton({ children, loading, className = '', variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) {
  return <button className={`btn btn-${variant} ${className}`} disabled={loading || props.disabled} {...props}>
    {loading ? <LoaderCircle size={17} className="spin" /> : null}{children}
  </button>;
}

export function PageHeading({ eyebrow, title, description, children }: { eyebrow: string; title: string; description?: string; children?: ReactNode }) {
  return <div className="page-heading"><div><div className="eyebrow"><Sparkles size={14} />{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{children}</div>;
}

export function Alert({ message, tone = 'error', onClose }: { message: string; tone?: 'error' | 'success' | 'info'; onClose?: () => void }) {
  return <div className={`alert alert-${tone}`} role="status"><span>{message}</span>{onClose && <button type="button" onClick={onClose} aria-label="Dismiss">×</button>}</div>;
}

export function EmptyConfiguration() {
  return <div className="empty-state config-state"><Zap size={44} className="neon-icon"/><h2>Connect Supabase to launch</h2><p>Add your Supabase URL and publishable key to your Vercel environment variables, and run the included SQL migration.</p><Link href="/demo" className="btn btn-primary">Preview the experience <ArrowUpRight size={16}/></Link></div>;
}

/**
 * Keeps the native date picker for keyboard and touch accessibility, but shows
 * a controlled, fixed-size date display on narrow screens. Mobile Safari can
 * impose intrinsic sizing on its native date text even when width: 100% is set.
 */
export function ConcertDateInput({ value, onChange, required, disabled }: {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  required?: boolean;
  disabled?: boolean;
}) {
  return <div className="concert-date-control" data-empty={value ? 'false' : 'true'}>
    <input className="concert-date-native" type="date" value={value} onChange={onChange} required={required} disabled={disabled} />
    <div className="concert-date-display" aria-hidden="true">
      <span className="concert-date-text">{value ? formatConcertDate(value) : 'Choose concert date'}</span>
      <CalendarDays size={18} />
    </div>
  </div>;
}

export function InputField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export function ShirtMark() { return <span className="shirt-mark"><Shirt size={27}/></span>; }
