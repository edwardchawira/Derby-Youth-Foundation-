"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Music, ShoppingCart, Menu, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/lib/cart-context';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/studio', label: 'Studio Services' },
  { href: '/equipment', label: 'Equipment Hire' },
  { href: '/musicians', label: 'Hire Talent' },
];

export function Navigation() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeProjectsCount, setActiveProjectsCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      checkAuthAndLoadProjects();

      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          loadProjectCount(session.user.id);
          setIsLoggedIn(true);
        } else {
          setActiveProjectsCount(0);
          setIsLoggedIn(false);
        }
      });
      unsubscribe = data?.subscription?.unsubscribe;
    } catch (err) {
      console.error('Auth setup error:', err);
    }

    return () => {
      unsubscribe?.();
    };
  }, []);

  const checkAuthAndLoadProjects = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await loadProjectCount(user.id);
      setIsLoggedIn(true);
    }
  };

  const loadProjectCount = async (userId: string) => {
    const { data: profile } = await supabase
      .from('musician_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (profile) {
      const { count } = await supabase
        .from('project_collaborators')
        .select('project_id', { count: 'exact', head: true })
        .eq('musician_id', profile.id);

      setActiveProjectsCount(count || 0);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background md:bg-background/95 md:backdrop-blur supports-[backdrop-filter]:md:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold">
            <Music className="h-6 w-6 text-gold" />
            <span className="text-foreground">Pinnacle <span className="text-gold">SSA</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-base font-medium py-2 px-1 transition-colors hover:text-gold ${
                  pathname === link.href ? 'text-gold' : 'text-foreground/80'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/cart">
              <Button variant="outline" size="sm" className="relative border-gold/50 hover:bg-gold/10">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gold text-background rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>
            {isLoggedIn ? (
              <Link href="/musician/dashboard">
                <Button variant="outline" size="sm" className="border-gold/50 hover:bg-gold/10 relative">
                  <Users className="h-4 w-4 mr-2" />
                  Projects
                  {activeProjectsCount > 0 && (
                    <Badge className="ml-2 bg-blue-500 text-white hover:bg-blue-600 text-xs px-1.5 py-0">
                      {activeProjectsCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            ) : (
              <Link href="/musicians/signin">
                <Button variant="outline" size="sm" className="border-gold/50 hover:bg-gold/10">
                  Musician Portal
                </Button>
              </Link>
            )}
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="text-gold hover:text-gold/80 hover:bg-gold/10">
                Admin
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden touch-target p-2 -mr-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-border/40">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-3.5 px-4 text-base font-medium transition-colors min-h-[44px] flex items-center ${
                  pathname === link.href ? 'text-gold' : 'text-foreground/80'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/cart" onClick={() => setMobileMenuOpen(false)} className="block">
              <Button variant="outline" size="lg" className="w-full relative border-gold/50 min-h-[48px] justify-center">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart {itemCount > 0 && `(${itemCount})`}
              </Button>
            </Link>
            {isLoggedIn ? (
              <Link href="/musician/dashboard" onClick={() => setMobileMenuOpen(false)} className="block">
                <Button variant="outline" size="lg" className="w-full border-gold/50 hover:bg-gold/10 relative min-h-[48px] justify-center">
                  <Users className="h-4 w-4 mr-2" />
                  Projects {activeProjectsCount > 0 && `(${activeProjectsCount})`}
                </Button>
              </Link>
            ) : (
              <Link href="/musicians/signin" onClick={() => setMobileMenuOpen(false)} className="block">
                <Button variant="outline" size="lg" className="w-full border-gold/50 min-h-[48px] justify-center">
                  Musician Portal
                </Button>
              </Link>
            )}
            <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="block">
              <Button variant="ghost" size="lg" className="w-full text-gold min-h-[48px] justify-center">
                Admin
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
