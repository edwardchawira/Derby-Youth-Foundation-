import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { CartProvider } from '@/lib/cart-context';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { FloatingChat } from '@/components/FloatingChat';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Pinnacle SSA - Professional Sound, Lighting & Studio Services',
  description: 'High-quality live event equipment hire, rehearsal space and recording services across the Midlands and the UK.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <Navigation />
          <main className="min-h-screen safe-x">
            {children}
          </main>
          <Footer />
          <FloatingChat />
        </CartProvider>
      </body>
    </html>
  );
}
