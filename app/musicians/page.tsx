"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/cart-context';
import { Users, Music, Mic, Guitar, Radio, Sparkles, Filter } from 'lucide-react';
import Image from 'next/image';
import EditableProfilePhoto from '@/components/editable-profile-photo';

interface Musician {
  id: string;
  user_id: string;
  full_name: string;
  role: string;
  bio: string;
  hourly_rate: number;
  session_rate: number;
  profile_photo_url: string;
  is_verified: boolean;
  is_active: boolean;
  total_bookings: number;
  profile_views: number;
  skills: { skill_name: string }[];
}

const categories = [
  { label: 'All', value: 'all', icon: Sparkles },
  { label: 'Drummers', value: 'Drummer', icon: Mic },
  { label: 'Bassists', value: 'Bassist', icon: Guitar },
  { label: 'Guitarists', value: 'Guitarist', icon: Guitar },
  { label: 'Keyboardists', value: 'Keyboardist', icon: Music },
  { label: 'Vocalists', value: 'Vocalist', icon: Mic },
  { label: 'Producers', value: 'Producer', icon: Radio },
  { label: 'Engineers', value: 'Engineer', icon: Radio },
  { label: 'Session Musicians', value: 'Session Musician', icon: Users },
];

export default function MusiciansPage() {
  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [filteredMusicians, setFilteredMusicians] = useState<Musician[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMusician, setSelectedMusician] = useState<Musician | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    fetchMusicians();
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredMusicians(musicians);
    } else {
      setFilteredMusicians(musicians.filter(m => m.role === selectedCategory));
    }
  }, [selectedCategory, musicians]);

  const fetchMusicians = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('musician_profiles')
      .select(`
        *,
        skills:musician_skills(skill_name)
      `)
      .eq('is_verified', true)
      .eq('is_active', true)
      .order('total_bookings', { ascending: false })
      .order('full_name');

    if (error) {
      console.error('Error fetching musicians:', error);
    } else {
      setMusicians(data || []);
      setFilteredMusicians(data || []);
    }
    setLoading(false);
  };

  const handleEnquire = (musician: Musician) => {
    const bookingItem = {
      id: `musician-${musician.id}`,
      name: `${musician.full_name} - ${musician.role}`,
      type: 'talent' as const,
      price: musician.session_rate || musician.hourly_rate || 0,
      duration: 1,
      durationUnit: 'hours' as const,
    };

    addItem(bookingItem);
    setSelectedMusician(null);
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Hire <span className="text-gold">Musicians & Creatives</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
              Connect with talented professionals for your next project. From session musicians to producers and engineers.
            </p>
            <Button
              onClick={() => window.location.href = '/musicians/signup'}
              className="bg-gold text-background hover:bg-gold/90"
            >
              Join as a Musician
            </Button>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-gold" />
              <span className="font-semibold">Filter by Category</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Button
                    key={cat.value}
                    variant={selectedCategory === cat.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.value)}
                    className={selectedCategory === cat.value ? 'bg-gold hover:bg-gold/90 text-background' : 'hover:border-gold/50'}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {cat.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
              <p className="mt-4 text-muted-foreground">Loading talent...</p>
            </div>
          ) : filteredMusicians.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground">No talent found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMusicians.map((musician) => (
                <Dialog key={musician.id} onOpenChange={(open) => !open && setSelectedMusician(null)}>
                  <DialogTrigger asChild>
                    <Card
                      className="bg-secondary/50 border-border/50 hover:border-gold/50 transition-all duration-300 cursor-pointer group overflow-hidden"
                      onClick={() => setSelectedMusician(musician)}
                    >
                      <div className="relative h-64 overflow-hidden">
                        {musician.profile_photo_url ? (
                          <div
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                            style={{
                              backgroundImage: `url(${musician.profile_photo_url})`
                            }}
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
                            <Users className="h-20 w-20 text-gold/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
                        {musician.is_verified && (
                          <div className="absolute top-4 right-4">
                            <Badge className="bg-gold text-background">Verified</Badge>
                          </div>
                        )}
                      </div>

                      <CardHeader>
                        <CardTitle className="text-xl text-gold">{musician.full_name}</CardTitle>
                        <CardDescription className="text-base font-semibold text-foreground/90">
                          {musician.role}
                        </CardDescription>
                      </CardHeader>

                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {musician.bio}
                        </p>

                        <div className="flex gap-2 flex-wrap mb-4">
                          {musician.skills.slice(0, 3).map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill.skill_name}
                            </Badge>
                          ))}
                          {musician.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{musician.skills.length - 3} more
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                          {musician.hourly_rate && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Hourly: </span>
                              <span className="font-bold text-gold">£{musician.hourly_rate}</span>
                            </div>
                          )}
                          {musician.session_rate && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Session: </span>
                              <span className="font-bold text-gold">£{musician.session_rate}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </DialogTrigger>

                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    {selectedMusician && selectedMusician.id === musician.id && (
                      <>
                        <DialogHeader>
                          <div className="flex items-center gap-2">
                            <DialogTitle className="text-2xl">{selectedMusician.full_name}</DialogTitle>
                            {selectedMusician.is_verified && (
                              <Badge className="bg-gold text-background">Verified</Badge>
                            )}
                          </div>
                          <DialogDescription className="text-lg font-semibold text-foreground/90">
                            {selectedMusician.role}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                          <div className="flex justify-center">
                            <EditableProfilePhoto
                              profileId={selectedMusician.id}
                              userId={selectedMusician.user_id}
                              currentPhotoUrl={selectedMusician.profile_photo_url}
                              fullName={selectedMusician.full_name}
                              size="xl"
                              editable={currentUserId === selectedMusician.user_id}
                              onPhotoUpdate={(newUrl) => {
                                setSelectedMusician({ ...selectedMusician, profile_photo_url: newUrl });
                                fetchMusicians();
                              }}
                            />
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold mb-2">About</h3>
                            <p className="text-muted-foreground">{selectedMusician.bio}</p>
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold mb-2">Skills & Expertise</h3>
                            <div className="flex gap-2 flex-wrap">
                              {selectedMusician.skills.map((skill, index) => (
                                <Badge key={index} variant="outline" className="text-sm">
                                  {skill.skill_name}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold mb-2">Track Record</h3>
                            <p className="text-muted-foreground">
                              {selectedMusician.total_bookings} completed bookings
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {selectedMusician.profile_views} profile views
                            </p>
                          </div>

                          <div className="border-t border-border pt-4">
                            <h3 className="text-lg font-semibold mb-3">Rates</h3>
                            <div className="grid grid-cols-2 gap-4">
                              {selectedMusician.hourly_rate && (
                                <div className="bg-secondary/50 p-4 rounded-lg">
                                  <div className="text-sm text-muted-foreground mb-1">Hourly Rate</div>
                                  <div className="text-2xl font-bold text-gold">£{selectedMusician.hourly_rate}</div>
                                </div>
                              )}
                              {selectedMusician.session_rate && (
                                <div className="bg-secondary/50 p-4 rounded-lg">
                                  <div className="text-sm text-muted-foreground mb-1">Session Rate</div>
                                  <div className="text-2xl font-bold text-gold">£{selectedMusician.session_rate}</div>
                                </div>
                              )}
                            </div>
                          </div>

                          <Button
                            size="lg"
                            className="w-full bg-gold text-background hover:bg-gold/90"
                            onClick={() => handleEnquire(selectedMusician)}
                          >
                            Enquire for Availability
                          </Button>
                        </div>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
