import { Music, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-secondary/30 mt-12 sm:mt-20 safe-bottom">
      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-12 max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Music className="h-6 w-6 text-gold" />
              <span className="text-lg font-bold">Pinnacle <span className="text-gold">SSA</span></span>
            </div>
            <p className="text-sm text-muted-foreground">
              Professional sound, lighting, and studio services across the Midlands and UK.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-gold">Quick Links</h3>
            <ul className="space-y-1 text-sm">
              <li><Link href="/" className="block py-3 text-muted-foreground hover:text-gold transition-colors">Home</Link></li>
              <li><Link href="/studio" className="block py-3 text-muted-foreground hover:text-gold transition-colors">Studio Services</Link></li>
              <li><Link href="/equipment" className="block py-3 text-muted-foreground hover:text-gold transition-colors">Equipment Hire</Link></li>
              <li><Link href="/musicians" className="block py-3 text-muted-foreground hover:text-gold transition-colors">Hire Talent</Link></li>
              <li><Link href="/cart" className="block py-3 text-muted-foreground hover:text-gold transition-colors">Book Now</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-gold">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 text-gold" />
                <a href="tel:+447478760211" className="hover:text-gold transition-colors">+44 7478760211</a>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 text-gold" />
                <span>Available on request</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-gold" />
                <span>Derby, DE23 8NL</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-gold">Business Hours</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Monday - Friday: 9am - 8pm</li>
              <li>Saturday: 10am - 6pm</li>
              <li>Sunday: By appointment</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/40 mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Pinnacle SSA. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
