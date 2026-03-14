"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import {
  Music,
  DollarSign,
  Eye,
  Calendar,
  Bell,
  Check,
  X,
  Users,
  MessageSquare,
  TrendingUp,
  Clock,
  MapPin,
  Mail,
  Phone,
  Settings,
  LogOut
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import CollaborativeProjects from '@/components/collaborative-projects';
import SettingsPanel from '@/components/settings-panel';

interface MusicianProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  bio: string;
  hourly_rate: number;
  session_rate: number;
  profile_photo_url: string;
  is_verified: boolean;
  open_to_collaboration: boolean;
  total_bookings: number;
  total_earnings: number;
  profile_views: number;
}

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  booking_date: string;
  start_time: string;
  duration_hours: number;
  service_type: string;
  location: string;
  total_amount: number;
  status: string;
  notes: string;
  created_at: string;
}

interface CollabMusician {
  id: string;
  full_name: string;
  role: string;
  bio: string;
  profile_photo_url: string;
  hourly_rate: number;
  skills: string[];
}

interface CollabRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  status: string;
  created_at: string;
  sender?: {
    full_name: string;
    role: string;
    profile_photo_url: string;
  };
  receiver?: {
    full_name: string;
    role: string;
    profile_photo_url: string;
  };
}

export default function MusicianDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MusicianProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [collabMusicians, setCollabMusicians] = useState<CollabMusician[]>([]);
  const [collabRequests, setCollabRequests] = useState<CollabRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMusician, setSelectedMusician] = useState<CollabMusician | null>(null);
  const [collabMessage, setCollabMessage] = useState('');
  const [activeProjectsCount, setActiveProjectsCount] = useState(0);
  const [openCollabRequestsCount, setOpenCollabRequestsCount] = useState(0);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [projectsRefreshKey, setProjectsRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    checkAuthAndLoadData();
    
    // Update last_seen on mount and set up heartbeat
    const updateLastSeen = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Call function to update last_seen
        await supabase.rpc('update_musician_last_seen_on_login', {
          musician_user_id: user.id
        });
      }
    };
    
    updateLastSeen();
    // Update every 2 minutes to keep session active
    const heartbeatInterval = setInterval(updateLastSeen, 2 * 60 * 1000);
    
    return () => {
      clearInterval(heartbeatInterval);
    };
  }, []);

  const checkAuthAndLoadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error('Please sign in to access your dashboard');
      router.push('/musicians/signin');
      return;
    }

    await loadProfile(user.id);
    setLoading(false);
  };

  const loadProfile = async (userId: string) => {
    const { data: profileData, error: profileError } = await supabase
      .from('musician_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError || !profileData) {
      await supabase.auth.signOut();
      toast.error('Profile not found. Please complete signup.');
      router.push('/musicians/signup');
      return;
    }

    // Update last_seen on login
    await supabase.rpc('update_musician_last_seen_on_login', {
      musician_user_id: userId
    });

    setProfile(profileData);
    await loadBookings(profileData.id);
    await loadCollabMusicians(profileData.id);
    await loadCollabRequests(profileData.id);
    await loadProjectCounts(profileData.id);
  };

  const loadBookings = async (musicianId: string) => {
    const { data, error } = await supabase
      .from('musician_bookings')
      .select('*')
      .eq('musician_id', musicianId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBookings(data);
    }
  };

  const loadCollabMusicians = async (currentMusicianId: string) => {
    const { data, error } = await supabase
      .from('musician_profiles')
      .select('id, full_name, role, bio, profile_photo_url, hourly_rate')
      .eq('is_verified', true)
      .eq('is_active', true)
      .eq('open_to_collaboration', true)
      .neq('id', currentMusicianId);

    if (!error && data) {
      const musiciansWithSkills = await Promise.all(
        data.map(async (musician) => {
          const { data: skills } = await supabase
            .from('musician_skills')
            .select('skill_name')
            .eq('musician_id', musician.id);

          return {
            ...musician,
            skills: skills?.map(s => s.skill_name) || [],
          };
        })
      );

      setCollabMusicians(musiciansWithSkills);
    }
  };

  const loadCollabRequests = async (musicianId: string) => {
    const { data, error } = await supabase
      .from('collaboration_requests')
      .select(`
        *,
        sender:sender_id(full_name, role, profile_photo_url),
        receiver:receiver_id(full_name, role, profile_photo_url)
      `)
      .or(`sender_id.eq.${musicianId},receiver_id.eq.${musicianId}`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCollabRequests(data);
    }
  };

  const loadProjectCounts = async (musicianId: string) => {
    const { count: projectsCount } = await supabase
      .from('project_collaborators')
      .select('project_id', { count: 'exact', head: true })
      .eq('musician_id', musicianId);

    const { count: pendingRequestsCount } = await supabase
      .from('collaboration_requests')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', musicianId)
      .eq('status', 'pending');

    setActiveProjectsCount(projectsCount || 0);
    setOpenCollabRequestsCount(pendingRequestsCount || 0);
  };

  const handleBookingAction = async (bookingId: string, action: 'accepted' | 'declined') => {
    const { error } = await supabase
      .from('musician_bookings')
      .update({
        status: action,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) {
      toast.error('Failed to update booking');
      return;
    }

    if (action === 'accepted' && profile) {
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        await supabase
          .from('musician_profiles')
          .update({
            total_bookings: profile.total_bookings + 1,
            total_earnings: profile.total_earnings + booking.total_amount,
          })
          .eq('id', profile.id);
      }
    }

    toast.success(`Booking ${action}`);
    if (profile) await loadBookings(profile.id);
  };

  const toggleCollaboration = async () => {
    if (!profile) return;

    const newValue = !profile.open_to_collaboration;

    const { error } = await supabase
      .from('musician_profiles')
      .update({ open_to_collaboration: newValue })
      .eq('id', profile.id);

    if (error) {
      toast.error('Failed to update collaboration status');
      return;
    }

    setProfile({ ...profile, open_to_collaboration: newValue });
    toast.success(newValue ? 'You are now open to collaboration' : 'Collaboration mode disabled');
  };

  const sendCollabRequest = async () => {
    if (!profile || !selectedMusician || !collabMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    const { error } = await supabase
      .from('collaboration_requests')
      .insert({
        sender_id: profile.id,
        receiver_id: selectedMusician.id,
        message: collabMessage,
        status: 'pending',
      });

    if (error) {
      toast.error('Failed to send collaboration request');
      return;
    }

    toast.success('Collaboration request sent!');
    setCollabMessage('');
    setSelectedMusician(null);
    if (profile) await loadCollabRequests(profile.id);
  };

  const handleCollabRequestAction = async (requestId: string, action: 'accepted' | 'declined') => {
    // Prevent double-clicks
    if (processingRequestId) return;

    setProcessingRequestId(requestId);

    try {
      if (action === 'accepted') {
        // Use database function for accepting (handles everything atomically)
        const { data, error } = await supabase.rpc('accept_collaboration_request', {
          request_id: requestId
        });

        if (error) {
          console.error('Accept error - Full details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            error: error
          });

          // Show detailed error message to user
          const errorMsg = error.message || 'Failed to accept request';
          toast.error(`Error: ${errorMsg}`, { duration: 5000 });
          return;
        }

        if (!data) {
          console.error('No data returned from accept_collaboration_request');
          toast.error('Failed to accept request - no response from server');
          return;
        }

        if (data && data.success) {
          console.log('Project created successfully:', data);
          toast.success('Collaboration accepted! A new project has been created.');

          setProjectsRefreshKey(prev => prev + 1);
        } else {
          console.error('Unexpected response:', data);
          toast.error('Request accepted but project creation status unclear');
        }
      } else {
        // For decline, just update the status
        const { error } = await supabase
          .from('collaboration_requests')
          .update({
            status: action,
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId);

        if (error) {
          console.error('Decline error:', error);
          toast.error('Failed to decline request');
          return;
        }

        toast.success('Request declined');
      }

      if (profile) await loadCollabRequests(profile.id);
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error('Failed to log out');
      return;
    }

    toast.success('Logged out successfully');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Music className="h-12 w-12 text-gold animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const upcomingBookings = bookings.filter(b => b.status === 'accepted');
  const receivedRequests = collabRequests.filter(r => r.receiver_id === profile.id && r.status === 'pending');
  const sentRequests = collabRequests.filter(r => r.sender_id === profile.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Toaster />

      <section className="bg-gradient-to-r from-background to-secondary/30 py-12 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-gold">
                <AvatarImage src={profile.profile_photo_url} />
                <AvatarFallback className="bg-gold/20 text-gold text-2xl">
                  {profile.full_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{profile.full_name}</h1>
                  {profile.is_verified ? (
                    <Badge className="bg-gold text-background">Verified</Badge>
                  ) : (
                    <Badge variant="outline">Pending Verification</Badge>
                  )}
                </div>
                <p className="text-xl text-gold mb-1">{profile.role}</p>
                <p className="text-muted-foreground">{profile.email}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="border-gold/50 hover:bg-gold/10">
                <Settings className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-5 max-w-[1000px] mx-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookings">
              Bookings
              {pendingBookings.length > 0 && (
                <Badge className="ml-2 bg-gold text-background" variant="secondary">
                  {pendingBookings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="collab">Collab Zone</TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card 
                className="bg-secondary/30 border-gold/50 cursor-pointer transition-all hover:bg-secondary/50 hover:border-gold hover:shadow-lg"
                onClick={() => setActiveTab('bookings')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                  <DollarSign className="h-4 w-4 text-gold" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gold">£{profile.total_earnings.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    From {profile.total_bookings} bookings
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="bg-secondary/30 border-border/50 cursor-pointer transition-all hover:bg-secondary/50 hover:border-gold hover:shadow-lg"
                onClick={() => setActiveTab('bookings')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{upcomingBookings.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {pendingBookings.length} pending
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="bg-secondary/30 border-primary/50 cursor-pointer transition-all hover:bg-secondary/50 hover:border-primary hover:shadow-lg"
                onClick={() => setActiveTab('projects')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{activeProjectsCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Collaboration projects
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="bg-secondary/30 border-accent/50 cursor-pointer transition-all hover:bg-secondary/50 hover:border-accent hover:shadow-lg"
                onClick={() => setActiveTab('collab')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Collab Requests</CardTitle>
                  <MessageSquare className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-accent">{openCollabRequestsCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pending invitations
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="bg-secondary/30 border-border/50 cursor-pointer transition-all hover:bg-secondary/50 hover:border-gold hover:shadow-lg"
                onClick={() => setActiveTab('settings')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{profile.profile_views}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                    Total views
                  </p>
                </CardContent>
              </Card>
            </div>

            {receivedRequests.length > 0 && (
              <Card className="bg-secondary/30 border-gold/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-gold" />
                    Notification Center
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {receivedRequests.slice(0, 3).map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-gold/30"
                    >
                      <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5 text-gold" />
                        <div>
                          <p className="font-medium">New Collaboration Request</p>
                          <p className="text-sm text-muted-foreground">
                            From {request.sender?.full_name || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="border-gold/50">
                        View
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            {pendingBookings.length > 0 && (
              <Card className="bg-secondary/30 border-gold/50">
                <CardHeader>
                  <CardTitle>Pending Requests ({pendingBookings.length})</CardTitle>
                  <CardDescription>Review and respond to booking requests</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pendingBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-4 bg-background/50 rounded-lg border border-border space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-lg">{booking.customer_name}</h4>
                          <p className="text-sm text-muted-foreground">{booking.service_type}</p>
                        </div>
                        <Badge className="bg-gold/20 text-gold">£{booking.total_amount}</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(booking.booking_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.start_time} ({booking.duration_hours}h)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{booking.customer_email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.customer_phone || 'Not provided'}</span>
                        </div>
                      </div>

                      {booking.location && (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <span>{booking.location}</span>
                        </div>
                      )}

                      {booking.notes && (
                        <div className="p-3 bg-background rounded border">
                          <p className="text-sm text-muted-foreground">Notes:</p>
                          <p className="text-sm mt-1">{booking.notes}</p>
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <Button
                          onClick={() => handleBookingAction(booking.id, 'accepted')}
                          className="flex-1 bg-gold text-background hover:bg-gold/90"
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => handleBookingAction(booking.id, 'declined')}
                          variant="outline"
                          className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card className="bg-secondary/30 border-border/50">
              <CardHeader>
                <CardTitle>Upcoming Sessions ({upcomingBookings.length})</CardTitle>
                <CardDescription>Your confirmed bookings</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No upcoming bookings</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="p-4 bg-background/50 rounded-lg border border-border"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{booking.customer_name}</h4>
                            <p className="text-sm text-muted-foreground">{booking.service_type}</p>
                          </div>
                          <Badge variant="outline" className="border-gold/50 text-gold">
                            £{booking.total_amount}
                          </Badge>
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(booking.booking_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {booking.start_time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <CollaborativeProjects
              key={projectsRefreshKey}
              currentMusicianId={profile.id}
              currentMusicianProfile={profile}
            />
          </TabsContent>

          <TabsContent value="collab" className="space-y-6">
            <Card className="bg-secondary/30 border-gold/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Collaboration Settings</CardTitle>
                    <CardDescription>Make yourself available for collaborations</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={profile.open_to_collaboration}
                      onCheckedChange={toggleCollaboration}
                      id="collab-mode"
                    />
                    <Label htmlFor="collab-mode">
                      {profile.open_to_collaboration ? 'Open' : 'Closed'}
                    </Label>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {receivedRequests.length > 0 && (
              <Card className="bg-secondary/30 border-border/50">
                <CardHeader>
                  <CardTitle>Collaboration Requests ({receivedRequests.length})</CardTitle>
                  <CardDescription>Musicians who want to work with you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {receivedRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 bg-background/50 rounded-lg border border-border space-y-3"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-gold">
                          <AvatarImage src={request.sender?.profile_photo_url} />
                          <AvatarFallback className="bg-gold/20 text-gold">
                            {request.sender?.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{request.sender?.full_name}</h4>
                          <p className="text-sm text-muted-foreground">{request.sender?.role}</p>
                        </div>
                      </div>
                      {request.message && (
                        <div className="p-3 bg-background rounded border">
                          <p className="text-sm">{request.message}</p>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleCollabRequestAction(request.id, 'accepted')}
                          className="flex-1 bg-gold text-background hover:bg-gold/90"
                          size="sm"
                          disabled={processingRequestId === request.id}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          {processingRequestId === request.id ? 'Processing...' : 'Accept'}
                        </Button>
                        <Button
                          onClick={() => handleCollabRequestAction(request.id, 'declined')}
                          variant="outline"
                          className="flex-1"
                          size="sm"
                          disabled={processingRequestId === request.id}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card className="bg-secondary/30 border-border/50">
              <CardHeader>
                <CardTitle>Find Collaborators</CardTitle>
                <CardDescription>
                  Connect with other verified musicians open to collaboration
                </CardDescription>
              </CardHeader>
              <CardContent>
                {collabMusicians.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No musicians available for collaboration at the moment
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {collabMusicians.map((musician) => (
                      <div
                        key={musician.id}
                        className="p-4 bg-background/50 rounded-lg border border-border space-y-3"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16 border-2 border-gold">
                            <AvatarImage src={musician.profile_photo_url} />
                            <AvatarFallback className="bg-gold/20 text-gold">
                              {musician.full_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold">{musician.full_name}</h4>
                            <p className="text-sm text-gold">{musician.role}</p>
                            <p className="text-xs text-muted-foreground">
                              £{musician.hourly_rate}/hour
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {musician.bio}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {musician.skills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {musician.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{musician.skills.length - 3} more
                            </Badge>
                          )}
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full border-gold/50 hover:bg-gold/10"
                              onClick={() => setSelectedMusician(musician)}
                            >
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Send Collab Request
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Send Collaboration Request</DialogTitle>
                              <DialogDescription>
                                Send a message to {musician.full_name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Textarea
                                value={collabMessage}
                                onChange={(e) => setCollabMessage(e.target.value)}
                                placeholder="Hi! I'd love to collaborate on a project..."
                                rows={4}
                              />
                              <Button
                                onClick={sendCollabRequest}
                                className="w-full bg-gold text-background hover:bg-gold/90"
                              >
                                Send Request
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SettingsPanel
              profile={profile}
              onProfileUpdate={() => loadProfile(profile.user_id)}
            />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
