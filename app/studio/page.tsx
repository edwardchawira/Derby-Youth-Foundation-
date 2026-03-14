"use client";

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Check, Music, Mic, Podcast, ChevronDown, CalendarDays } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/cart-context';
import { StudioAvailabilityCalendar } from '@/components/studio-availability-calendar';
import { StudioTimeSlotPicker } from '@/components/studio-time-slot-picker';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

interface StudioService {
  id: string;
  name: string;
  type: string;
  hourly_rate: number;
  four_hour_rate: number;
  eight_hour_rate: number;
  three_hour_rate?: number | null;
  description: string;
  features: string[];
}

export default function StudioPage() {
  const [services, setServices] = useState<StudioService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const { addItem } = useCart();

  const startTime = selectedSlots.length > 0 ? [...selectedSlots].sort()[0] : undefined;
  const hoursFromSlots = selectedSlots.length;

  const handleSelectDate = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlots([]);
  };

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const { data } = await supabase
        .from('studio_services')
        .select('*')
        .order('type');

      if (data) setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = (service: StudioService, hours: number): number => {
    if (service.type === 'podcast' && service.three_hour_rate != null) {
      if (hours <= 3) return Number(service.three_hour_rate);
      return Number(service.three_hour_rate) + (hours - 3) * Number(service.hourly_rate);
    }
    if (hours >= 8 && service.eight_hour_rate) {
      const blocks = Math.floor(hours / 8);
      const remaining = hours % 8;
      return (blocks * service.eight_hour_rate) + (remaining * service.hourly_rate);
    } else if (hours >= 4 && service.four_hour_rate) {
      const blocks = Math.floor(hours / 4);
      const remaining = hours % 4;
      return (blocks * service.four_hour_rate) + (remaining * service.hourly_rate);
    }
    return hours * service.hourly_rate;
  };

  const handleAddService = (service: StudioService) => {
    if (!selectedDate) {
      toast.error('Please select an available date from the calendar');
      return;
    }
    if (selectedSlots.length === 0) {
      toast.error('Please click on time slots to select your hours');
      return;
    }
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const hrs = hoursFromSlots;
    const price = calculatePrice(service, hrs);
    const timeLabel = startTime ? format(new Date(`2000-01-01T${startTime}:00`), 'h:mm a') : '';
    addItem({
      id: `studio-${service.id}-${hrs}hrs-${dateStr}-${startTime}`,
      name: `${service.name} (${hrs} hour${hrs > 1 ? 's' : ''}) - ${format(selectedDate, 'dd MMM yyyy')} at ${timeLabel}`,
      type: 'studio',
      price: price,
      duration: hrs,
      durationUnit: 'hours',
      bookingDate: dateStr,
      bookingTime: startTime,
    });
    toast.success(`${service.name} added to cart!`);
  };

  const rehearsalServices = services.filter(s => s.type === 'rehearsal');
  const recordingServices = services.filter(s => s.type === 'recording');
  const podcastServices = services.filter(s => s.type === 'podcast');

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Loading studio services...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Toaster />

      <section className="relative overflow-hidden h-[200px] xs:h-[240px] sm:h-[320px] md:h-[400px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/images/studio-full-room.jpg)'
          }}
        />
        <div className="absolute inset-0 hero-overlay" />

        <div className="relative container mx-auto px-4 sm:px-6 h-full flex items-center">
          <div className="max-w-3xl mx-auto text-center space-y-3 sm:space-y-4">
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold drop-shadow-lg px-2 sm:px-4 text-white">
              Studio <span className="text-secondary">Services</span>
            </h1>
            <p className="text-sm xs:text-base sm:text-lg md:text-xl text-white/95 drop-shadow-md px-2 sm:px-4">
              Professional rehearsal space and recording studio facilities. Book by the hour or take advantage of our block rates.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 py-10 sm:py-12 md:py-16 max-w-7xl bg-gradient-to-b from-accent/15 via-muted/50 to-background min-h-screen">
        <Tabs defaultValue="rehearsal" className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-8 sm:mb-12 bg-muted/80 p-1 gap-0.5 sm:gap-1 border border-border/60">
            <TabsTrigger value="rehearsal" className="py-3 sm:py-2.5 px-3 sm:px-4 text-sm sm:text-base min-h-[44px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
              <Music className="h-4 w-4 mr-1.5 sm:mr-2 shrink-0" />
              Rehearsal
            </TabsTrigger>
            <TabsTrigger value="recording" className="py-3 sm:py-2.5 px-3 sm:px-4 text-sm sm:text-base min-h-[44px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
              <Mic className="h-4 w-4 mr-1.5 sm:mr-2 shrink-0" />
              Recording
            </TabsTrigger>
            <TabsTrigger value="podcast" className="py-3 sm:py-2.5 px-3 sm:px-4 text-sm sm:text-base min-h-[44px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
              <Podcast className="h-4 w-4 mr-1.5 sm:mr-2 shrink-0" />
              Podcast
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rehearsal" className="space-y-8">
            {rehearsalServices.map((service) => {
              const rehearsalMinHours = 3;
              const hrs = hoursFromSlots;
              const meetsMin = hrs >= rehearsalMinHours;
              const totalPrice = meetsMin ? calculatePrice(service, hrs) : 0;

              return (
                <Card key={service.id} className="bg-card/95 border-border/60 max-w-4xl mx-auto overflow-hidden group shadow-md">
                  <div className="relative h-48 sm:h-56 overflow-hidden">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                      style={{
                        backgroundImage: 'url(/images/studio-wide-angle.jpg)'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                  </div>
                  <CardHeader className="pb-2 sm:pb-6">
                    <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <CardTitle className="text-2xl sm:text-3xl mb-2 text-primary">{service.name}</CardTitle>
                        <CardDescription className="text-sm sm:text-base">{service.description}</CardDescription>
                      </div>
                      <Badge className="bg-primary text-primary-foreground shrink-0 self-start border-0">
                        <Music className="h-3 w-3 mr-1" />
                        Rehearsal
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg border border-border/50 min-h-[72px] flex flex-col justify-center">
                        <p className="text-xl sm:text-2xl font-bold text-primary">£{service.hourly_rate}</p>
                        <p className="text-sm text-muted-foreground">per hour</p>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg border border-primary/30 min-h-[72px] flex flex-col justify-center">
                        <p className="text-xl sm:text-2xl font-bold text-primary">£{service.four_hour_rate}</p>
                        <p className="text-sm text-muted-foreground">4 hour block</p>
                        <p className="text-xs font-medium text-accent">Save £{(service.hourly_rate * 4) - service.four_hour_rate}</p>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg border border-primary/30 min-h-[72px] flex flex-col justify-center">
                        <p className="text-xl sm:text-2xl font-bold text-primary">£{service.eight_hour_rate}</p>
                        <p className="text-sm text-muted-foreground">8 hour block</p>
                        <p className="text-xs font-medium text-accent">Save £{(service.hourly_rate * 8) - service.eight_hour_rate}</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-3 text-lg">What's Included</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {service.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4">
                    <Collapsible className="group">
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between border-primary/50 hover:bg-primary/10 hover:border-primary/70 transition-colors min-h-[48px] py-3 px-4"
                        >
                          <span className="flex items-center gap-2">
                            <CalendarDays className="h-5 w-5 text-primary" />
                            Select date & hours
                          </span>
                          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="pt-4 space-y-4">
                          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                            <div className="w-full md:min-w-[280px] md:w-auto">
                              <StudioAvailabilityCalendar
                                selected={selectedDate}
                                onSelect={handleSelectDate}
                                accentColor="sky"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              {selectedDate ? (
                                <StudioTimeSlotPicker
                                  selectedDate={selectedDate}
                                  selectedSlots={selectedSlots}
                                  onSlotsChange={setSelectedSlots}
                                  minHours={3}
                                  accentColor="sky"
                                />
                              ) : (
                                <div className="h-full min-h-[200px] flex items-center justify-center rounded-md border border-dashed border-primary/30 bg-primary/5">
                                  <p className="text-sm text-muted-foreground text-center px-4">
                                    Select a date to see available time slots
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <Separator />
                          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                            <div className="flex-1 w-full">
                              <Label className="text-sm mb-2 block">Selected</Label>
                              <p className="text-base sm:text-lg font-medium">
                                {hrs > 0 ? `${hrs} hour${hrs !== 1 ? 's' : ''}${startTime ? ` at ${format(new Date(`2000-01-01T${startTime}:00`), 'h:mm a')}` : ''}${!meetsMin && hrs > 0 ? ` (min 4h for rehearsal)` : ''}` : 'Select time slots above'}
                              </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 sm:items-end flex-1 w-full">
                              <div className="flex-1">
                                <Label className="text-sm mb-2 block">Total Price</Label>
                                <p className="text-2xl sm:text-3xl font-bold text-primary">£{totalPrice}</p>
                              </div>
                              <Button
                                onClick={() => handleAddService(service)}
                                disabled={!selectedDate || !meetsMin}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg disabled:opacity-50 w-full sm:w-auto min-h-[48px] py-3"
                              >
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Add to Cart
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardFooter>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="recording" className="space-y-8">
            {recordingServices.map((service) => {
              const recordingMinHours = 2;
              const hrs = hoursFromSlots;
              const meetsMin = hrs >= recordingMinHours;
              const totalPrice = meetsMin ? calculatePrice(service, hrs) : 0;

              return (
                <Card key={service.id} className="bg-card/95 border-border/60 max-w-4xl mx-auto overflow-hidden group shadow-md">
                  <div className="relative h-48 sm:h-56 overflow-hidden">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                      style={{
                        backgroundImage: 'url(/images/studio-keyboard-closeup.jpg)'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                  </div>
                  <CardHeader className="pb-2 sm:pb-6">
                    <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <CardTitle className="text-2xl sm:text-3xl mb-2 text-primary">{service.name}</CardTitle>
                        <CardDescription className="text-sm sm:text-base">{service.description}</CardDescription>
                      </div>
                      <Badge className="bg-primary text-primary-foreground shrink-0 self-start border-0">
                        <Mic className="h-3 w-3 mr-1" />
                        Recording
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg border border-border/50 min-h-[72px] flex flex-col justify-center">
                        <p className="text-xl sm:text-2xl font-bold text-primary">£{service.hourly_rate}</p>
                        <p className="text-sm text-muted-foreground">per hour</p>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg border border-primary/30 min-h-[72px] flex flex-col justify-center">
                        <p className="text-xl sm:text-2xl font-bold text-primary">£{service.four_hour_rate}</p>
                        <p className="text-sm text-muted-foreground">4 hour block</p>
                        <p className="text-xs font-medium text-accent">Save £{(service.hourly_rate * 4) - service.four_hour_rate}</p>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg border border-primary/30 min-h-[72px] flex flex-col justify-center">
                        <p className="text-xl sm:text-2xl font-bold text-primary">£{service.eight_hour_rate}</p>
                        <p className="text-sm text-muted-foreground">8 hour block</p>
                        <p className="text-xs font-medium text-accent">Save £{(service.hourly_rate * 8) - service.eight_hour_rate}</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-3 text-lg">What's Included</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {service.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4">
                    <Collapsible className="group">
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between border-primary/50 hover:bg-primary/10 hover:border-primary/70 transition-colors min-h-[48px] py-3 px-4"
                        >
                          <span className="flex items-center gap-2">
                            <CalendarDays className="h-5 w-5 text-primary" />
                            Select date & hours
                          </span>
                          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="pt-4 space-y-4">
                          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                            <div className="w-full md:min-w-[280px] md:w-auto">
                              <StudioAvailabilityCalendar
                                selected={selectedDate}
                                onSelect={handleSelectDate}
                                accentColor="teal"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              {selectedDate ? (
                                <StudioTimeSlotPicker
                                  selectedDate={selectedDate}
                                  selectedSlots={selectedSlots}
                                  onSlotsChange={setSelectedSlots}
                                  minHours={2}
                                  accentColor="teal"
                                />
                              ) : (
                                <div className="h-full min-h-[200px] flex items-center justify-center rounded-md border border-dashed border-primary/30 bg-primary/5">
                                  <p className="text-sm text-muted-foreground text-center px-4">
                                    Select a date to see available time slots
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <Separator />
                          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                            <div className="flex-1 w-full">
                              <Label className="text-sm mb-2 block">Selected</Label>
                              <p className="text-base sm:text-lg font-medium">
                                {hrs > 0 ? `${hrs} hour${hrs !== 1 ? 's' : ''}${startTime ? ` at ${format(new Date(`2000-01-01T${startTime}:00`), 'h:mm a')}` : ''}${!meetsMin && hrs > 0 ? ` (min 2h for recording)` : ''}` : 'Select time slots above'}
                              </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 sm:items-end flex-1 w-full">
                              <div className="flex-1">
                                <Label className="text-sm mb-2 block">Total Price</Label>
                                <p className="text-2xl sm:text-3xl font-bold text-primary">£{totalPrice}</p>
                              </div>
                              <Button
                                onClick={() => handleAddService(service)}
                                disabled={!selectedDate || !meetsMin}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg disabled:opacity-50 w-full sm:w-auto min-h-[48px] py-3"
                              >
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Add to Cart
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardFooter>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="podcast" className="space-y-8">
            {podcastServices.length === 0 ? (
              <Card className="bg-card/95 border-border/60 max-w-4xl mx-auto overflow-hidden group shadow-md">
                <div className="relative h-56 overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                    style={{
                      backgroundImage: 'url(/images/studio-podcast.jpg)'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                </div>
                <CardHeader className="pb-2 sm:pb-6">
                  <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <CardTitle className="text-2xl sm:text-3xl mb-2 text-primary">Podcast Studio</CardTitle>
                      <CardDescription className="text-sm sm:text-base">
                        Professional podcast recording with dedicated setup, broadcast-grade microphones, and multi-camera coverage. Ideal for interviews, shows, and content creation.
                      </CardDescription>
                    </div>
                    <Badge className="bg-primary text-primary-foreground shrink-0 self-start border-0">
                      <Podcast className="h-3 w-3 mr-1" />
                      Podcast
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-3 text-base sm:text-lg">What&apos;s Included</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">Dedicated 3-hour recording slot</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">4× Rode Podmic dynamic podcast microphones</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">4× 4K camera angles (Panasonic GH5)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">Up to 60-minute edited video (included)</span>
                      </div>
                    </div>
                    </div>
                  </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Collapsible className="group">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between border-primary/50 hover:bg-primary/10 hover:border-primary/70 transition-colors min-h-[48px] py-3 px-4"
                      >
                        <span className="flex items-center gap-2">
                          <CalendarDays className="h-5 w-5 text-primary" />
                          View availability calendar
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="pt-4 space-y-4">
                        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                          <div className="md:min-w-[280px]">
                            <StudioAvailabilityCalendar
                              selected={selectedDate}
                              onSelect={handleSelectDate}
                              accentColor="teal"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            {selectedDate ? (
                                <StudioTimeSlotPicker
                                  selectedDate={selectedDate}
                                  selectedSlots={selectedSlots}
                                  onSlotsChange={setSelectedSlots}
                                  minHours={3}
                                  accentColor="teal"
                                />
                            ) : (
                              <div className="h-full min-h-[200px] flex items-center justify-center rounded-md border border-dashed border-primary/30 bg-primary/5">
                                <p className="text-sm text-muted-foreground text-center px-4">
                                  Select a date to see available time slots
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">Pricing and bookings coming soon.</p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardFooter>
              </Card>
            ) : podcastServices.map((service) => {
              const podcastMinHours = 3;
              const hrs = hoursFromSlots;
              const meetsMin = hrs >= podcastMinHours;
              const totalPrice = meetsMin ? calculatePrice(service, hrs) : 0;
              const threeHourRate = service.three_hour_rate != null ? Number(service.three_hour_rate) : null;

              return (
                <Card key={service.id} className="bg-card/95 border-border/60 max-w-4xl mx-auto overflow-hidden group shadow-md">
                  <div className="relative h-48 sm:h-56 overflow-hidden">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                      style={{
                        backgroundImage: 'url(/images/studio-podcast.jpg)'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                  </div>
                  <CardHeader className="pb-2 sm:pb-6">
                    <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <CardTitle className="text-2xl sm:text-3xl mb-2 text-primary">{service.name}</CardTitle>
                        <CardDescription className="text-sm sm:text-base">{service.description}</CardDescription>
                      </div>
                      <Badge className="bg-primary text-primary-foreground shrink-0 self-start border-0">
                        <Podcast className="h-3 w-3 mr-1" />
                        Podcast
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg border border-primary/30 min-h-[72px] flex flex-col justify-center">
                        <p className="text-xl sm:text-2xl font-bold text-primary">£{threeHourRate ?? service.four_hour_rate}</p>
                        <p className="text-sm text-muted-foreground">3 hour block <span className="text-accent font-medium">(min)</span></p>
                        <p className="text-xs font-medium text-accent">Includes equipment & video edit</p>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg border border-border/50 min-h-[72px] flex flex-col justify-center">
                        <p className="text-xl sm:text-2xl font-bold text-primary">£{service.hourly_rate}</p>
                        <p className="text-sm text-muted-foreground">per extra hour</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-3 text-lg">What's Included</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {service.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4">
                    <Collapsible className="group">
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between border-primary/50 hover:bg-primary/10 hover:border-primary/70 transition-colors min-h-[48px] py-3 px-4"
                        >
                          <span className="flex items-center gap-2">
                            <CalendarDays className="h-5 w-5 text-primary" />
                            Select date & hours
                          </span>
                          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="pt-4 space-y-4">
                          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                            <div className="w-full md:min-w-[280px] md:w-auto">
                              <StudioAvailabilityCalendar
                                selected={selectedDate}
                                onSelect={handleSelectDate}
                                accentColor="teal"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              {selectedDate ? (
                                <StudioTimeSlotPicker
                                  selectedDate={selectedDate}
                                  selectedSlots={selectedSlots}
                                  onSlotsChange={setSelectedSlots}
                                  minHours={3}
                                  accentColor="teal"
                                />
                              ) : (
                                <div className="h-full min-h-[200px] flex items-center justify-center rounded-md border border-dashed border-primary/30 bg-primary/5">
                                  <p className="text-sm text-muted-foreground text-center px-4">
                                    Select a date to see available time slots
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <Separator />
                          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                            <div className="flex-1 w-full">
                              <Label className="text-sm mb-2 block">Selected</Label>
                              <p className="text-base sm:text-lg font-medium">
                                {hrs > 0 ? `${hrs} hour${hrs !== 1 ? 's' : ''}${startTime ? ` at ${format(new Date(`2000-01-01T${startTime}:00`), 'h:mm a')}` : ''}${!meetsMin && hrs > 0 ? ` (min 3h for podcast)` : ''}` : 'Select time slots above'}
                              </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 sm:items-end flex-1 w-full">
                              <div className="flex-1">
                                <Label className="text-sm mb-2 block">Total Price</Label>
                                <p className="text-2xl sm:text-3xl font-bold text-primary">£{totalPrice}</p>
                              </div>
                              <Button
                                onClick={() => handleAddService(service)}
                                disabled={!selectedDate || !meetsMin}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg disabled:opacity-50 w-full sm:w-auto min-h-[48px] py-3"
                              >
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Add to Cart
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardFooter>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
