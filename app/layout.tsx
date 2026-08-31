import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VMC-01 Operator HMI',
  description: 'Primeform Labs VMC startup and operation workflow',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
