import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Neon Threads | Secret Concert Tee Exchange',
  description: 'Create a rave crew, draw secret T-shirt assignments, and make something legendary.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
