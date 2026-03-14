"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { BookingDialog } from '@/components/booking-dialog';

interface Package {
  name: string;
  price_per_day: number;
  recommended_capacity: string;
}

interface EquipmentItem {
  name: string;
  price_per_day: number;
}

interface StudioService {
  name: string;
  type: string;
  hourly_rate: number;
  four_hour_rate: number;
  eight_hour_rate: number;
}

export default function PricingPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [services, setServices] = useState<StudioService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [packagesRes, equipmentRes, servicesRes] = await Promise.all([
        supabase.from('packages').select('name, price_per_day, recommended_capacity').order('price_per_day'),
        supabase.from('equipment_items').select('name, price_per_day').order('name'),
        supabase.from('studio_services').select('name, type, hourly_rate, four_hour_rate, eight_hour_rate').order('type'),
      ]);

      if (packagesRes.data) setPackages(packagesRes.data);
      if (equipmentRes.data) setEquipment(equipmentRes.data);
      if (servicesRes.data) setServices(servicesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Loading pricing...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-b from-background to-secondary/20 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold">
              Price <span className="text-gold">List</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Transparent pricing for all our equipment and services. All prices shown are per day for equipment hire.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 space-y-16">
        <Card className="bg-secondary/30 border-border/50">
          <CardHeader>
            <CardTitle className="text-3xl">Event Packages</CardTitle>
            <p className="text-muted-foreground">Complete solutions with all equipment included</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gold">Package Name</TableHead>
                  <TableHead className="text-gold">Recommended Capacity</TableHead>
                  <TableHead className="text-gold text-right">Price per Day</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell className="text-muted-foreground">{pkg.recommended_capacity}</TableCell>
                    <TableCell className="text-right text-gold font-bold">£{pkg.price_per_day}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-secondary/30 border-border/50">
          <CardHeader>
            <CardTitle className="text-3xl">A La Carte Equipment</CardTitle>
            <p className="text-muted-foreground">Individual items available for hire</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gold">Equipment</TableHead>
                  <TableHead className="text-gold text-right">Price per Day</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipment.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right text-gold font-bold">£{item.price_per_day}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-secondary/30 border-border/50">
          <CardHeader>
            <CardTitle className="text-3xl">Studio Services</CardTitle>
            <p className="text-muted-foreground">Rehearsal and recording rates with block discounts</p>
          </CardHeader>
          <CardContent className="space-y-8">
            {services.map((service, idx) => (
              <div key={idx}>
                {idx > 0 && <Separator className="my-8" />}
                <div className="mb-4">
                  <h4 className="text-xl font-bold mb-1">{service.name}</h4>
                  <p className="text-sm text-muted-foreground capitalize">{service.type} Service</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {service.type === 'rehearsal' ? (
                    <>
                      <div className="p-4 bg-background/50 rounded-lg border border-gold/30 flex flex-col">
                        <p className="text-sm text-muted-foreground mb-1">3 Hour Block <span className="text-gold font-medium">(min)</span></p>
                        <p className="text-2xl font-bold text-gold mb-3">£{(service.hourly_rate * 3).toFixed(2)}</p>
                        <BookingDialog
                          serviceName={`${service.name} - 3 Hours`}
                          servicePrice={service.hourly_rate * 3}
                          sessionHours={3}
                          trigger={
                            <Button size="sm" className="mt-auto w-full bg-gold text-background hover:bg-gold/90">
                              Book 3 Hours
                            </Button>
                          }
                        />
                      </div>
                      <div className="p-4 bg-background/50 rounded-lg border border-border/50 flex flex-col">
                        <p className="text-sm text-muted-foreground mb-1">4 Hour Block</p>
                        <p className="text-2xl font-bold text-gold">£{service.four_hour_rate}</p>
                        <p className="text-xs text-gold mb-3">£{(service.four_hour_rate / 4).toFixed(2)}/hour</p>
                        <BookingDialog
                          serviceName={`${service.name} - 4 Hours`}
                          servicePrice={service.four_hour_rate}
                          sessionHours={4}
                          trigger={
                            <Button size="sm" className="mt-auto w-full bg-gold text-background hover:bg-gold/90">
                              Book 4 Hours
                            </Button>
                          }
                        />
                      </div>
                      <div className="p-4 bg-background/50 rounded-lg border border-border/50 flex flex-col">
                        <p className="text-sm text-muted-foreground mb-1">8 Hour Block</p>
                        <p className="text-2xl font-bold text-gold">£{service.eight_hour_rate}</p>
                        <p className="text-xs text-gold mb-3">£{(service.eight_hour_rate / 8).toFixed(2)}/hour</p>
                        <BookingDialog
                          serviceName={`${service.name} - 8 Hours`}
                          servicePrice={service.eight_hour_rate}
                          sessionHours={8}
                          trigger={
                            <Button size="sm" className="mt-auto w-full bg-gold text-background hover:bg-gold/90">
                              Book 8 Hours
                            </Button>
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-4 bg-background/50 rounded-lg border border-border/50 flex flex-col">
                        <p className="text-sm text-muted-foreground mb-1">Hourly Rate</p>
                        <p className="text-2xl font-bold text-gold mb-3">£{service.hourly_rate}</p>
                        <BookingDialog
                          serviceName={`${service.name} - 1 Hour`}
                          servicePrice={service.hourly_rate}
                          sessionHours={1}
                          trigger={
                            <Button size="sm" className="mt-auto w-full bg-gold text-background hover:bg-gold/90">
                              Book 1 Hour
                            </Button>
                          }
                        />
                      </div>
                      <div className="p-4 bg-background/50 rounded-lg border border-gold/30 flex flex-col">
                        <p className="text-sm text-muted-foreground mb-1">4 Hour Block</p>
                        <p className="text-2xl font-bold text-gold">£{service.four_hour_rate}</p>
                        <p className="text-xs text-gold mb-3">£{(service.four_hour_rate / 4).toFixed(2)}/hour</p>
                        <BookingDialog
                          serviceName={`${service.name} - 4 Hours`}
                          servicePrice={service.four_hour_rate}
                          sessionHours={4}
                          trigger={
                            <Button size="sm" className="mt-auto w-full bg-gold text-background hover:bg-gold/90">
                              Book 4 Hours
                            </Button>
                          }
                        />
                      </div>
                      <div className="p-4 bg-background/50 rounded-lg border border-gold/30 flex flex-col">
                        <p className="text-sm text-muted-foreground mb-1">8 Hour Block</p>
                        <p className="text-2xl font-bold text-gold">£{service.eight_hour_rate}</p>
                        <p className="text-xs text-gold mb-3">£{(service.eight_hour_rate / 8).toFixed(2)}/hour</p>
                        <BookingDialog
                          serviceName={`${service.name} - 8 Hours`}
                          servicePrice={service.eight_hour_rate}
                          sessionHours={8}
                          trigger={
                            <Button size="sm" className="mt-auto w-full bg-gold text-background hover:bg-gold/90">
                              Book 8 Hours
                            </Button>
                          }
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-secondary/30 border-border/50">
          <CardHeader>
            <CardTitle className="text-3xl">Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2 text-gold">Delivery</h4>
              <p className="text-muted-foreground">Delivery calculated from base location (DE23 8NL) at £0.40 per mile. Final delivery cost calculated at checkout.</p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold text-lg mb-2 text-gold">Multi-Day Discounts</h4>
              <p className="text-muted-foreground">Extended hire periods may qualify for special rates. Contact us for multi-week bookings.</p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold text-lg mb-2 text-gold">Payment Terms</h4>
              <p className="text-muted-foreground">50% deposit required at booking confirmation. Balance due 48 hours before event/session date.</p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold text-lg mb-2 text-gold">Cancellation Policy</h4>
              <p className="text-muted-foreground">Full refund if cancelled 7+ days before booking. 50% refund if cancelled 3-7 days before. No refund within 48 hours of booking.</p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center py-8">
          <h3 className="text-2xl font-bold mb-4">Ready to Book?</h3>
          <p className="text-muted-foreground mb-6">Browse our equipment and studio services to get started</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/equipment">
              <Button size="lg" className="bg-gold text-background hover:bg-gold/90 px-8">
                View Equipment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/studio">
              <Button size="lg" variant="outline" className="border-gold/50 hover:bg-gold/10 px-8">
                Studio Services
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
