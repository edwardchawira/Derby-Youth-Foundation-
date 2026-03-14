import Image from 'next/image';
import { Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-accent mt-12 sm:mt-20 safe-bottom text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-12 max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image src="/logo.png" alt="Derby Youth Foundation" width={180} height={52} className="h-12 w-auto object-contain brightness-0 invert" />
            </div>
            <p className="text-sm text-primary-foreground/80">
              Professional sound, lighting, and studio services across the Midlands and UK.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-primary-foreground">Quick Links</h3>
            <ul className="space-y-1 text-sm">
              <li><Link href="/" className="block py-3 text-primary-foreground/80 hover:text-primary-foreground transition-colors">Home</Link></li>
              <li><Link href="/studio" className="block py-3 text-primary-foreground/80 hover:text-primary-foreground transition-colors">Studio Services</Link></li>
              <li><Link href="/equipment" className="block py-3 text-primary-foreground/80 hover:text-primary-foreground transition-colors">Equipment Hire</Link></li>
              <li><Link href="/musicians" className="block py-3 text-primary-foreground/80 hover:text-primary-foreground transition-colors">Hire Talent</Link></li>
              <li><Link href="/cart" className="block py-3 text-primary-foreground/80 hover:text-primary-foreground transition-colors">Book Now</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-primary-foreground">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-primary-foreground/80">
                <Phone className="h-4 w-4 text-secondary" />
                <a href="tel:+447478760211" className="hover:text-primary-foreground transition-colors">+44 7478760211</a>
              </li>
              <li className="flex items-center gap-2 text-primary-foreground/80">
                <Mail className="h-4 w-4 text-secondary" />
                <span>Available on request</span>
              </li>
              <li className="flex items-center gap-2 text-primary-foreground/80">
                <MapPin className="h-4 w-4 text-secondary" />
                <span>Derby, DE23 8NL</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-primary-foreground">Business Hours</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li>Monday - Friday: 9am - 8pm</li>
              <li>Saturday: 10am - 6pm</li>
              <li>Sunday: By appointment</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/40 mt-8 pt-8 text-center text-sm text-primary-foreground/80">
          <p>&copy; {new Date().getFullYear()} Derby Youth Foundation. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
