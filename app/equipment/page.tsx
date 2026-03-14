"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Users, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/cart-context';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

interface Package {
  id: string;
  name: string;
  description: string;
  price_per_day: number;
  features: string[];
  recommended_capacity: string;
}

const packageImages: { [key: string]: string } = {
  'Small Event': 'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Medium Event': 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Large Event': 'https://images.pexels.com/photos/2263436/pexels-photo-2263436.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Full Production': 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800',
};

const packageColors: { [key: string]: string } = {
  'Small Event': 'teal',
  'Medium Event': 'sky',
  'Large Event': 'coral',
  'Full Production': 'gold',
};

export default function EquipmentPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [durations, setDurations] = useState<{ [key: string]: number }>({});
  const { addItem } = useCart();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data, error } = await supabase.from('packages').select('*').order('price_per_day');
      if (error) throw error;
      if (data) setPackages(data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPackage = (pkg: Package, days: number) => {
    addItem({
      id: `package-${pkg.id}-${days}days`,
      name: `${pkg.name} (${days} day${days > 1 ? 's' : ''})`,
      type: 'package',
      price: pkg.price_per_day,
      duration: days,
      durationUnit: 'days',
    });
    toast.success(`${pkg.name} added to cart!`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Loading equipment...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Toaster />

      <section className="relative overflow-hidden h-[300px] sm:h-[400px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/1047442/pexels-photo-1047442.jpeg?auto=compress&cs=tinysrgb&w=1920)'
          }}
        />
        <div className="absolute inset-0 hero-overlay" />

        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold drop-shadow-lg px-4">
              Equipment <span className="text-gold">Hire</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-200 drop-shadow-md px-4">
              Professional sound and lighting packages for live events of any size. All equipment is maintained to the highest standards.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-4">Event Packages</h2>
          <p className="text-muted-foreground">Complete solutions for your event. Engineer included in larger packages.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {packages.map((pkg) => {
            const days = durations[`package-${pkg.id}`] || 1;
            const totalPrice = pkg.price_per_day * days;
            const color = packageColors[pkg.name] || 'gold';
            const image = packageImages[pkg.name];

            return (
              <Card key={pkg.id} className={`bg-secondary/30 border-border/50 hover:border-${color}/50 transition-all duration-300 flex flex-col overflow-hidden group`}>
                {image && (
                  <div className="relative h-48 overflow-hidden">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundImage: `url(${image})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className={`text-2xl text-${color}`}>{pkg.name}</CardTitle>
                    <Badge variant="outline" className={`border-${color}/50 text-${color}`}>
                      <Users className="h-3 w-3 mr-1" />
                      {pkg.recommended_capacity}
                    </Badge>
                  </div>
                  <CardDescription className="text-base">{pkg.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="mb-6">
                    <p className="text-3xl font-bold text-gold">£{pkg.price_per_day}</p>
                    <p className="text-sm text-muted-foreground">per day</p>
                  </div>
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    {pkg.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <div className="w-full grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`days-package-${pkg.id}`} className="text-sm">Days</Label>
                      <Input
                        id={`days-package-${pkg.id}`}
                        type="number"
                        min="1"
                        value={days}
                        onChange={(e) => setDurations({ ...durations, [`package-${pkg.id}`]: parseInt(e.target.value) || 1 })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Total</Label>
                      <p className="text-2xl font-bold text-gold mt-1">£{totalPrice}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleAddPackage(pkg, days)}
                    className="w-full gradient-gold text-background hover:opacity-90 shadow-lg"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
