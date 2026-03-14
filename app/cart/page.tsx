"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, ShoppingBag, Truck, Calendar, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

const BASE_POSTCODE = 'DE23 8NL';
const DELIVERY_RATE = 0.40;

function calculateDistance(postcode: string): number {
  const cleaned = postcode.toUpperCase().replace(/\s/g, '');

  if (cleaned.startsWith('DE23')) return 0;
  if (cleaned.startsWith('DE')) return Math.floor(Math.random() * 10) + 5;
  if (cleaned.startsWith('NG')) return Math.floor(Math.random() * 20) + 10;
  if (cleaned.startsWith('LE')) return Math.floor(Math.random() * 30) + 15;

  const firstLetter = cleaned.charAt(0);
  const secondDigit = parseInt(cleaned.charAt(1)) || 0;
  return Math.floor(Math.random() * 50) + (firstLetter.charCodeAt(0) - 65) * 5 + secondDigit * 2;
}

function generateBookingNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `PSA-${timestamp}-${random}`;
}

function formatStudioTimeRange(bookingTime: string | undefined, durationHours: number): string {
  if (!bookingTime || !durationHours) return '';
  const [h, m] = bookingTime.split(':').map(Number);
  const startMins = (h || 0) * 60 + (m || 0);
  const endMins = startMins + durationHours * 60;
  const endH = Math.floor(endMins / 60);
  const endM = endMins % 60;
  const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  return `${bookingTime}-${endTime}`;
}

function CartContent() {
  const searchParams = useSearchParams();
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryPostcode, setDeliveryPostcode] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [fullyBlockedDates, setFullyBlockedDates] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');
  const [distance, setDistance] = useState<number | null>(null);
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingNumber, setBookingNumber] = useState('');
  const cancelToastShown = useRef(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    supabase
      .from('blocked_slots')
      .select('blocked_date')
      .gte('blocked_date', today)
      .then(({ data }) => {
        const countByDate = new Map<string, number>();
        (data || []).forEach((r) => {
          const c = (countByDate.get(r.blocked_date) || 0) + 1;
          countByDate.set(r.blocked_date, c);
        });
        const fullyBlocked = new Set<string>();
        countByDate.forEach((count, date) => {
          if (count >= 15) fullyBlocked.add(date);
        });
        setFullyBlockedDates(fullyBlocked);
      });
  }, []);

  useEffect(() => {
    const success = searchParams.get('success');
    const bookingNum = searchParams.get('booking_number');
    const canceled = searchParams.get('canceled');

    // Only clear cart when payment completed successfully (never when user cancelled)
    if (success === 'true' && bookingNum && !canceled) {
      setBookingNumber(bookingNum);
      setBookingComplete(true);
      clearCart();
    }

    // Reassure user when they return from Stripe without paying
    if (canceled === 'true') {
      if (!cancelToastShown.current) {
        toast.info('Your items are still in your cart. Complete your purchase whenever you\'re ready.');
        cancelToastShown.current = true;
      }
      window.history.replaceState({}, '', '/cart');
    }
  }, [searchParams, clearCart]);

  const handleCalculateDelivery = () => {
    if (!deliveryPostcode.trim()) {
      toast.error('Please enter a postcode');
      return;
    }
    const dist = calculateDistance(deliveryPostcode);
    setDistance(dist);
    setDeliveryCost(dist * DELIVERY_RATE);
    toast.success(`Delivery calculated: ${dist} miles`);
  };

  const hasEquipment = items.some((item) => item.type === 'equipment' || item.type === 'package');
  const effectiveBookingDate = hasEquipment ? bookingDate : (items.find((i) => i.bookingDate)?.bookingDate ?? bookingDate);

  const handleSubmitBooking = async () => {
    if (!customerName || !customerEmail) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (hasEquipment && !bookingDate) {
      toast.error('Please select your event/session date');
      return;
    }
    if (hasEquipment && fullyBlockedDates.has(bookingDate)) {
      toast.error('The selected date is not available for booking. Please choose a different date.');
      return;
    }
    if (!hasEquipment && !items.some((i) => i.bookingDate)) {
      toast.error('Invalid booking: no date found');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsSubmitting(true);

    try {
      const effectiveDeliveryCost = hasEquipment ? deliveryCost : 0;
      const finalTotal = total + effectiveDeliveryCost;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      const response = await fetch(`${supabaseUrl}/functions/v1/create-equipment-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          deliveryPostcode: hasEquipment ? deliveryPostcode : undefined,
          deliveryDistance: hasEquipment ? distance : undefined,
          deliveryCost: effectiveDeliveryCost,
          bookingDate: effectiveBookingDate,
          durationDays: 1,
          items,
          subtotal: total,
          total: finalTotal,
          notes,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (bookingComplete) {
    return (
      <div className="min-h-screen">
        <Toaster />
        <section className="container mx-auto px-4 py-20">
          <Card className="max-w-2xl mx-auto bg-secondary/30 border-gold/50">
            <CardHeader className="text-center">
              <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-10 w-10 text-gold" />
              </div>
              <CardTitle className="text-3xl mb-2">Booking Confirmed!</CardTitle>
              <CardDescription className="text-base">
                Your booking has been successfully submitted
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-background/50 p-6 rounded-lg border border-gold/30">
                <p className="text-sm text-muted-foreground mb-2">Your Booking Number</p>
                <p className="text-3xl font-bold text-gold tracking-wider">{bookingNumber}</p>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="font-semibold text-lg">What happens next?</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                    <span>Payment has been processed successfully</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                    <span>You will receive a confirmation email with all booking details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                    <span>Our team will prepare your equipment for delivery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                    <span>You&apos;ll receive delivery updates 24 hours before your booking date</span>
                  </li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gold text-background hover:bg-gold/90"
              >
                Return to Home
              </Button>
            </CardFooter>
          </Card>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Toaster />

      <section className="bg-gradient-to-b from-background to-secondary/20 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold">
              Your <span className="text-gold">Cart</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Review your items and complete your booking
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        {items.length === 0 ? (
          <Card className="max-w-2xl mx-auto bg-secondary/30 border-border/50 text-center py-12">
            <CardContent>
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-6">Add some equipment or studio time to get started</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => window.location.href = '/equipment'} className="bg-gold text-background hover:bg-gold/90">
                  Browse Equipment
                </Button>
                <Button onClick={() => window.location.href = '/studio'} variant="outline" className="border-gold/50 hover:bg-gold/10">
                  Studio Services
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-secondary/30 border-border/50">
                <CardHeader>
                  <CardTitle className="text-2xl">Cart Items</CardTitle>
                  <CardDescription>{items.length} item{items.length !== 1 ? 's' : ''} in cart</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-gold">Item</TableHead>
                          <TableHead className="text-gold text-center">Quantity</TableHead>
                          <TableHead className="text-gold text-right">Price</TableHead>
                          <TableHead className="text-gold text-right">Total</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              <div>
                                <span>{item.name}</span>
                                {item.type === 'studio' && item.bookingTime && item.duration && (
                                  <p className="text-sm text-muted-foreground mt-0.5">
                                    {formatStudioTimeRange(item.bookingTime, item.duration)}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                className="w-20 mx-auto"
                              />
                            </TableCell>
                            <TableCell className="text-right">£{(item.type === 'studio' ? item.price : item.price * (item.duration || 1)).toFixed(2)}</TableCell>
                            <TableCell className="text-right font-bold text-gold">
                              £{(item.type === 'studio' ? item.price * item.quantity : item.price * item.quantity * (item.duration || 1)).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.id)}
                                className="hover:bg-destructive/10 hover:text-destructive touch-target"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Mobile-friendly card layout */}
                  <div className="md:hidden space-y-4">
                    {items.map((item) => (
                      <Card key={item.id} className="bg-background/50 border-border/50">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-base">{item.name}</h4>
                              {item.type === 'studio' && item.bookingTime && item.duration && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {formatStudioTimeRange(item.bookingTime, item.duration)}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground mt-1">
                                £{(item.type === 'studio' ? item.price : item.price * (item.duration || 1)).toFixed(2)}{item.type === 'studio' ? '' : ' per unit'}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="hover:bg-destructive/10 hover:text-destructive touch-target shrink-0"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-border/50">
                            <div className="flex items-center gap-3">
                              <Label htmlFor={`qty-${item.id}`} className="text-sm">Quantity:</Label>
                              <Input
                                id={`qty-${item.id}`}
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                className="w-20"
                              />
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Total</p>
                              <p className="text-lg font-bold text-gold">
                                £{(item.type === 'studio' ? item.price * item.quantity : item.price * item.quantity * (item.duration || 1)).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-secondary/30 border-border/50">
                <CardHeader>
                  <CardTitle className="text-2xl">Booking Details</CardTitle>
                  <CardDescription>Tell us about your event or session</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Your full name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="07XXX XXXXXX"
                        className="mt-1"
                      />
                    </div>
                    {hasEquipment && (
                      <div>
                        <Label htmlFor="date">Event/Session Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any special requirements or questions..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {hasEquipment && (
                <Card className="bg-secondary/30 border-border/50">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Truck className="h-6 w-6 text-gold" />
                      Delivery
                    </CardTitle>
                    <CardDescription>Base: {BASE_POSTCODE} - £{DELIVERY_RATE}/mile</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="postcode">Delivery Postcode</Label>
                      <Input
                        id="postcode"
                        value={deliveryPostcode}
                        onChange={(e) => setDeliveryPostcode(e.target.value.toUpperCase())}
                        placeholder="SW1A 1AA"
                        className="mt-1"
                      />
                    </div>
                    <Button
                      onClick={handleCalculateDelivery}
                      variant="outline"
                      className="w-full border-gold/50 hover:bg-gold/10"
                    >
                      Calculate Delivery
                    </Button>
                    {distance !== null && (
                      <div className="bg-background/50 p-4 rounded-lg border border-gold/30">
                        <p className="text-sm text-muted-foreground mb-1">Distance</p>
                        <p className="text-xl font-bold">{distance} miles</p>
                        <p className="text-sm text-muted-foreground mt-2 mb-1">Delivery Cost</p>
                        <p className="text-2xl font-bold text-gold">£{deliveryCost.toFixed(2)}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="bg-secondary/30 border-gold/50">
                <CardHeader>
                  <CardTitle className="text-2xl">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-bold">£{total.toFixed(2)}</span>
                  </div>
                  {hasEquipment && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery</span>
                      <span className="font-bold">£{deliveryCost.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-xl">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-gold">£{(total + (hasEquipment ? deliveryCost : 0)).toFixed(2)}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleSubmitBooking}
                    disabled={isSubmitting}
                    className="w-full bg-gold text-background hover:bg-gold/90 text-lg py-6"
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading cart...</p>
      </div>
    }>
      <CartContent />
    </Suspense>
  );
}
