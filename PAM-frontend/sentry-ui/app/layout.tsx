import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
//import { AuthProvider } from '@/lib/auth-context';
import './globals.css';
import { AuthProvider } from '../lib/auth-context';

export const metadata: Metadata = {
  title: 'Sentry — Privileged Access Management',
  description: 'Secure access request and approval platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        {/* AuthProvider wraps everything so useAuth() works in any component */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}