import type { Metadata } from 'next';
import { Oxanium } from 'next/font/google';
import './globals.css';

// Self-hosted by Next.js. Only the large group dashboard title uses this font.
const oxanium = Oxanium({ subsets: ['latin'], weight: '700', display: 'swap', variable: '--font-oxanium' });

export const metadata: Metadata = {
  title: 'Neon Threads | Secret Concert Tee Exchange',
  description: 'Create a rave crew, draw secret T-shirt assignments, and make something legendary.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={oxanium.variable}><body>{children}</body></html>;
}
