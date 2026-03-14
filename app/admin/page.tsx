"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Lock, LogOut, Package, Calendar, Image, FileText, TrendingUp, Users, Check, X, Music, FolderOpen, Upload, MessageSquare, Activity, ChevronLeft, ChevronRight, CalendarX2, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Booking {
  id: string;
  booking_number?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  booking_date: string;
  total?: number;
  package_price?: number;
  status?: string;
  booking_status?: string;
  created_at: string;
  // Equipment booking fields
  items?: any[];
  duration_days?: number;
  subtotal?: number;
  delivery_cost?: number;
  delivery_postcode?: string;
  // Studio booking fields
  package_name?: string;
  booking_time?: string;
  session_hours?: number;
  payment_status?: string;
  special_requests?: string;
  booking_type?: 'equipment' | 'studio';
}

interface MusicianProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  bio: string;
  hourly_rate: number;
  session_rate: number;
  profile_photo_url: string;
  is_verified: boolean;
  created_at: string;
  skills: { skill_name: string }[];
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [musicians, setMusicians] = useState<MusicianProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMusician, setSelectedMusician] = useState<MusicianProfile | null>(null);
  const [stats, setStats] = useState({
    activeMusicians: 0,
    loggedInMusicians: 0,
    activeProjects: 0,
    totalFiles: 0,
    totalFileSize: 0,
    totalCollaborators: 0,
    totalMessages: 0,
    totalComments: 0,
    totalRevenue: 0,
    paidBookingsCount: 0,
  });
  const [projects, setProjects] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loggedInMusicians, setLoggedInMusicians] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [studioBookings, setStudioBookings] = useState<Booking[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<Set<string>>(new Set()); // keys: "date|time"
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [blockedSlotsLoading, setBlockedSlotsLoading] = useState(false);
  const [sendEmailLoading, setSendEmailLoading] = useState(false);
  const [emailOverrides, setEmailOverrides] = useState({
    customer_name: '',
    customer_email: '',
    booking_date: '',
    session_start_time: '',
    service_description: '',
    custom_message: '',
  });

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!SUPABASE_URL) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  useEffect(() => {
    const loggedIn = sessionStorage.getItem('admin-logged-in');
    const adminUser = sessionStorage.getItem('admin-username');
    const adminPass = sessionStorage.getItem('admin-password');

    if (loggedIn === 'true' && adminUser && adminPass) {
      setIsLoggedIn(true);
      setUsername(adminUser);
      setPassword(adminPass);
      loadBookings(adminUser, adminPass);
      loadStudioBookings(adminUser, adminPass);
      loadMusicians(adminUser, adminPass);
      loadStats(adminUser, adminPass);
      loadProjects(adminUser, adminPass);
      loadFiles(adminUser, adminPass);
      loadBlockedSlots(adminUser, adminPass);
    }
  }, []);

  const loadBlockedSlots = async (user?: string, pass?: string) => {
    try {
      const authUser = user || username;
      const authPass = pass || password;
      const apiUrl = `${SUPABASE_URL}/functions/v1/admin-operations/blocked-slots`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: getAuthHeaders(authUser, authPass),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to load blocked slots');
      }
      const { blockedSlots: slots } = await response.json();
      const set = new Set<string>((slots || []).map((s: { date: string; time: string }) => `${s.date}|${s.time}`));
      setBlockedSlots(set);
    } catch (error) {
      console.error('Error loading blocked slots:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load blocked slots');
    }
  };

  const toggleBlockedSlot = async (dateStr: string, timeStr: string) => {
    const authUser = username;
    const authPass = password;
    const headers = getAuthHeaders(authUser, authPass);
    const baseUrl = `${SUPABASE_URL}/functions/v1/admin-operations/blocked-slots`;
    const key = `${dateStr}|${timeStr}`;
    const isBlocked = blockedSlots.has(key);

    // Optimistic update: apply immediately for smooth UX
    setBlockedSlots((prev) => {
      const next = new Set(prev);
      if (isBlocked) next.delete(key);
      else next.add(key);
      return next;
    });

    try {
      if (isBlocked) {
        const res = await fetch(`${baseUrl}?date=${encodeURIComponent(dateStr)}&time=${encodeURIComponent(timeStr)}`, {
          method: 'DELETE',
          headers,
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to unblock slot');
        }
        toast.success(`${dateStr} at ${timeStr} is now available for booking`);
      } else {
        const res = await fetch(baseUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ date: dateStr, time: timeStr }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to block slot');
        }
        toast.success(`${dateStr} at ${timeStr} is now blocked from booking`);
      }
    } catch (error) {
      // Revert on failure
      setBlockedSlots((prev) => {
        const next = new Set(prev);
        if (isBlocked) next.add(key);
        else next.delete(key);
        return next;
      });
      toast.error(error instanceof Error ? error.message : 'Failed to update slot');
    }
  };

  const BUSINESS_HOURS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
  const isSlotBlocked = (dateStr: string, timeStr: string) => blockedSlots.has(`${dateStr}|${timeStr}`);
  const blockedCountForDate = (dateStr: string) => BUSINESS_HOURS.filter((t) => isSlotBlocked(dateStr, t)).length;

  // Customer-booked slots from studio_bookings (pending, confirmed, completed)
  const bookedByCustomers = useMemo(() => {
    const set = new Set<string>();
    studioBookings
      .filter((b) => ['pending', 'confirmed', 'completed'].includes(b.booking_status || b.status || ''))
      .forEach((b) => {
        const date = b.booking_date;
        const [h] = String(b.booking_time || '09:00').split(':').map(Number);
        const hours = Math.max(1, Number(b.session_hours) || 1);
        for (let i = 0; i < hours; i++) {
          const t = `${String((h || 9) + i).padStart(2, '0')}:00`;
          set.add(`${date}|${t}`);
        }
      });
    return set;
  }, [studioBookings]);

  const isSlotBookedByCustomer = (dateStr: string, timeStr: string) => bookedByCustomers.has(`${dateStr}|${timeStr}`);
  const bookedCountForDate = (dateStr: string) => BUSINESS_HOURS.filter((t) => isSlotBookedByCustomer(dateStr, t)).length;

  const lastTapRef = useRef<{ date: string; time: number } | null>(null);
  const expandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleBlockedWholeDay = async (dateStr: string) => {
    const authUser = username;
    const authPass = password;
    const headers = getAuthHeaders(authUser, authPass);
    const baseUrl = `${SUPABASE_URL}/functions/v1/admin-operations/blocked-slots`;
    const isFullyBlocked = blockedCountForDate(dateStr) === BUSINESS_HOURS.length;

    setBlockedSlotsLoading(true);
    try {
      if (isFullyBlocked) {
        const res = await fetch(`${baseUrl}?date=${encodeURIComponent(dateStr)}&unblock_whole_day=true`, {
          method: 'DELETE',
          headers,
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to unblock day');
        }
        setBlockedSlots((prev) => {
          const next = new Set(prev);
          BUSINESS_HOURS.forEach((t) => next.delete(`${dateStr}|${t}`));
          return next;
        });
        toast.success(`${dateStr} is now fully available for booking`);
      } else {
        const res = await fetch(baseUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ date: dateStr, block_whole_day: true }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to block day');
        }
        setBlockedSlots((prev) => {
          const next = new Set(prev);
          BUSINESS_HOURS.forEach((t) => next.add(`${dateStr}|${t}`));
          return next;
        });
        toast.success(`${dateStr} is now fully blocked from booking`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update day');
    } finally {
      setBlockedSlotsLoading(false);
    }
  };

  const handleDateClick = (dateStr: string, isPast: boolean, isExpanded: boolean) => {
    if (isPast) return;

    const now = Date.now();
    const last = lastTapRef.current;
    const isDoubleTap = last?.date === dateStr && now - last.time < 350;

    if (isDoubleTap) {
      lastTapRef.current = null;
      if (expandTimeoutRef.current) {
        clearTimeout(expandTimeoutRef.current);
        expandTimeoutRef.current = null;
      }
      toggleBlockedWholeDay(dateStr);
      return;
    }

    lastTapRef.current = { date: dateStr, time: now };
    if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
    expandTimeoutRef.current = setTimeout(() => {
      expandTimeoutRef.current = null;
      setExpandedDate((prev) => (prev === dateStr ? null : dateStr));
    }, 250);
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadLoggedInMusicians();
      const cleanup = setupActiveUsersSubscription();

      // Realtime: refresh stats (including revenue) when revenue_entries or bookings change
      const revenueChannel = supabase
        .channel('admin-revenue-updates')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'revenue_entries' }, () => {
          loadStats(username, password);
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, () => {
          loadBookings(username, password);
          loadStats(username, password);
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'studio_bookings' }, () => {
          loadStudioBookings(username, password);
          loadStats(username, password);
        })
        .subscribe();

      // Poll every 30 seconds to catch any missed updates
      const pollInterval = setInterval(() => {
        loadLoggedInMusicians();
        loadStats(username, password);
      }, 30000);

      return () => {
        if (cleanup) cleanup();
        supabase.removeChannel(revenueChannel);
        clearInterval(pollInterval);
      };
    }
  }, [isLoggedIn]);

  const getAuthHeaders = (user: string, pass: string) => {
    const credentials = btoa(`${user}:${pass}`);
    return {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY || ''}`,
      'X-Admin-Auth': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    };
  };

  useEffect(() => {
    if (selectedBooking?.booking_number?.startsWith('PSA-')) {
      const durationDays = selectedBooking.duration_days ?? 1;
      const itemsList = selectedBooking.items && Array.isArray(selectedBooking.items)
        ? selectedBooking.items.map((item: any) => {
            const qty = item.quantity || 1;
            const name = item.name || 'Item';
            const isStudio = item.type === 'studio';
            const unitLabel = isStudio ? 'hour(s)' : 'day(s)';
            const unitCount = isStudio ? (item.duration || 1) : (item.duration ?? durationDays);
            return `${qty}x ${name} (${unitCount} ${unitLabel})`;
          }).join(', ')
        : '';
      setEmailOverrides({
        customer_name: selectedBooking.customer_name || '',
        customer_email: selectedBooking.customer_email || '',
        booking_date: selectedBooking.booking_date || '',
        session_start_time: selectedBooking.booking_time || '',
        service_description: itemsList,
        custom_message: '',
      });
    }
  }, [selectedBooking?.id, selectedBooking?.booking_number]);

  const sendConfirmationEmail = async (bookingNumber: string, overrides: typeof emailOverrides) => {
    setSendEmailLoading(true);
    try {
      const apiUrl = `${SUPABASE_URL}/functions/v1/admin-operations/send-confirmation-email`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: getAuthHeaders(username, password),
        body: JSON.stringify({
          booking_number: bookingNumber,
          overrides: {
            customer_name: overrides.customer_name || undefined,
            customer_email: overrides.customer_email || undefined,
            booking_date: overrides.booking_date || undefined,
            session_start_time: overrides.session_start_time || undefined,
            service_description: overrides.service_description || undefined,
            custom_message: overrides.custom_message || undefined,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }
      toast.success('Confirmation email sent successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send email');
    } finally {
      setSendEmailLoading(false);
    }
  };

  const loadBookings = async (user?: string, pass?: string) => {
    setLoading(true);
    try {
      const authUser = user || username;
      const authPass = pass || password;

      const apiUrl = `${SUPABASE_URL}/functions/v1/admin-operations/bookings`;
      console.log('Loading bookings from:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: getAuthHeaders(authUser, authPass),
      });

      console.log('Bookings response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Bookings error:', errorData);
        throw new Error(errorData.error || 'Failed to load bookings');
      }

      const { bookings: data } = await response.json();
      console.log('Loaded bookings:', data?.length || 0);
      if (data) {
        const formattedData = data.map((b: any) => ({
          ...b,
          booking_type: 'equipment' as const,
        }));
        setBookings(formattedData);
      }
    } catch (error: any) {
      console.error('Error loading bookings:', error);
      toast.error(error.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const loadStudioBookings = async (user?: string, pass?: string) => {
    try {
      // Load studio bookings directly from Supabase
      const { data, error } = await supabase
        .from('studio_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading studio bookings:', error);
        return;
      }

      if (data) {
        const formattedData = data.map((b: any) => ({
          ...b,
          booking_type: 'studio' as const,
          booking_number: `STUDIO-${b.id.substring(0, 8).toUpperCase()}`,
          total: b.package_price,
          status: b.booking_status,
        }));
        setStudioBookings(formattedData);
      }
    } catch (error: any) {
      console.error('Error loading studio bookings:', error);
    }
  };

  const loadBookingDetails = async (bookingId: string, bookingType: 'equipment' | 'studio') => {
    if (!bookingId) {
      toast.error('Invalid booking ID');
      return;
    }

    try {
      // First, try to find the booking in the already-loaded arrays
      if (bookingType === 'equipment') {
        const existingBooking = bookings.find(b => b.id === bookingId);
        if (existingBooking) {
          setSelectedBooking(existingBooking);
          return;
        }

        // If not found in loaded bookings, try to query Supabase
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single();

        if (error) {
          console.error('Error loading equipment booking from Supabase:', error);
          // Try using the API endpoint as fallback
          if (username && password) {
            const authUser = username;
            const authPass = password;
            const apiUrl = `${SUPABASE_URL}/functions/v1/admin-operations/bookings`;
            
            try {
              const response = await fetch(apiUrl, {
                method: 'GET',
                headers: getAuthHeaders(authUser, authPass),
              });

              if (response.ok) {
                const { bookings: apiBookings } = await response.json();
                const foundBooking = apiBookings?.find((b: any) => b.id === bookingId);
                if (foundBooking) {
                  setSelectedBooking({ ...foundBooking, booking_type: 'equipment' });
                  return;
                }
              }
            } catch (apiError) {
              console.error('Error loading booking from API:', apiError);
            }
          }
          
          throw error;
        }
        
        if (data) {
          setSelectedBooking({ ...data, booking_type: 'equipment' });
        } else {
          toast.error('Booking not found');
        }
      } else {
        // For studio bookings, check if already loaded
        const existingBooking = studioBookings.find(b => b.id === bookingId);
        if (existingBooking) {
          setSelectedBooking(existingBooking);
          return;
        }

        // If not found, query Supabase
        const { data, error } = await supabase
          .from('studio_bookings')
          .select('*')
          .eq('id', bookingId)
          .single();

        if (error) {
          console.error('Error loading studio booking:', error);
          throw error;
        }
        
        if (data) {
          setSelectedBooking({
            ...data,
            booking_type: 'studio',
            booking_number: `STUDIO-${data.id.substring(0, 8).toUpperCase()}`,
            total: data.package_price,
            status: data.booking_status,
          });
        } else {
          toast.error('Booking not found');
        }
      }
    } catch (error: any) {
      console.error('Error loading booking details:', error);
      const errorMessage = error?.message || error?.code || 'Unknown error';
      toast.error(`Failed to load booking details: ${errorMessage}`);
    }
  };

  const loadMusicians = async (user?: string, pass?: string) => {
    try {
      const authUser = user || username;
      const authPass = pass || password;

      const apiUrl = `${SUPABASE_URL}/functions/v1/admin-operations/musicians`;
      console.log('Loading musicians from:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: getAuthHeaders(authUser, authPass),
      });

      console.log('Musicians response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Musicians error:', errorData);
        throw new Error(errorData.error || 'Failed to load musicians');
      }

      const { musicians: data } = await response.json();
      console.log('Loaded musicians:', data?.length || 0, 'musicians');
      console.log('Unverified musicians:', data?.filter((m: any) => !m.is_verified).length || 0);
      if (data) {
        setMusicians(data);
      }
    } catch (error: any) {
      console.error('Error loading musicians:', error);
      toast.error(error.message || 'Failed to load musicians');
    }
  };

  const handleApproveMusician = async (musicianId: string) => {
    try {
      const apiUrl = `${SUPABASE_URL}/functions/v1/admin-operations/approve-musician`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: getAuthHeaders(username, password),
        body: JSON.stringify({ musicianId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to approve musician');
      }

      toast.success('Musician profile approved successfully!');
      setSelectedMusician(null);
      loadMusicians();
    } catch (error: any) {
      console.error('Error approving musician:', error);
      toast.error(error.message || 'Failed to approve musician');
    }
  };

  const handleRejectMusician = async (musicianId: string) => {
    try {
      const apiUrl = `${SUPABASE_URL}/functions/v1/admin-operations/reject-musician`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: getAuthHeaders(username, password),
        body: JSON.stringify({ musicianId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to reject musician');
      }

      toast.success('Musician profile rejected');
      setSelectedMusician(null);
      loadMusicians();
    } catch (error: any) {
      console.error('Error rejecting musician:', error);
      toast.error(error.message || 'Failed to reject musician');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (username === 'admin' && password === 'pinnacle2024') {
      sessionStorage.setItem('admin-logged-in', 'true');
      sessionStorage.setItem('admin-username', username);
      sessionStorage.setItem('admin-password', password);
      setIsLoggedIn(true);
      loadBookings(username, password);
      loadStudioBookings(username, password);
      loadMusicians(username, password);
      loadStats(username, password);
      loadProjects(username, password);
      loadFiles(username, password);
      toast.success('Welcome to the admin dashboard');
    } else {
      toast.error('Invalid credentials');
    }
  };

  const loadLoggedInMusicians = async () => {
    try {
      // Get musicians who have been seen recently (within last 10 minutes)
      // This indicates they are currently logged in and active
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      
      // Query for musicians with recent last_seen timestamp
      const { data: activeMusicians, error } = await supabase
        .from('musician_profiles')
        .select('id, full_name, email, role, profile_photo_url, last_seen')
        .eq('is_verified', true)
        .eq('is_active', true)
        .gte('last_seen', tenMinutesAgo)
        .order('last_seen', { ascending: false });

      if (error) {
        console.error('Error loading logged in musicians:', error);
        return;
      }

      setLoggedInMusicians(activeMusicians || []);
      setStats(prev => ({
        ...prev,
        loggedInMusicians: activeMusicians?.length || 0,
      }));
    } catch (error: any) {
      console.error('Error loading logged in musicians:', error);
    }
  };

  const setupActiveUsersSubscription = () => {
    // Subscribe to real-time updates for last_seen changes in musician_profiles
    const channel = supabase
      .channel('admin-active-users')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'musician_profiles',
          filter: 'last_seen=neq.null',
        },
        () => {
          loadLoggedInMusicians();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_chat_messages',
        },
        () => {
          loadLoggedInMusicians();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_files',
        },
        () => {
          loadLoggedInMusicians();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_comments',
        },
        () => {
          loadLoggedInMusicians();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadStats = async (user?: string, pass?: string) => {
    try {
      const authUser = user || username;
      const authPass = pass || password;

      // Load active musicians count
      const { count: activeMusiciansCount } = await supabase
        .from('musician_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', true)
        .eq('is_active', true);

      // Load active projects count
      const { count: activeProjectsCount } = await supabase
        .from('collaboration_projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Load total files count and size
      const { data: filesData, count: filesCount } = await supabase
        .from('project_files')
        .select('file_size', { count: 'exact' });

      const totalFileSize = filesData?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0;

      // Load total collaborators
      const { count: collaboratorsCount } = await supabase
        .from('project_collaborators')
        .select('*', { count: 'exact', head: true });

      // Load total messages
      const { count: messagesCount } = await supabase
        .from('project_chat_messages')
        .select('*', { count: 'exact', head: true });

      // Load total comments
      const { count: commentsCount } = await supabase
        .from('project_comments')
        .select('*', { count: 'exact', head: true });

      // Load total revenue from revenue_entries (updated by stripe-webhook on payment confirm)
      const { data: revenueData } = await supabase
        .from('revenue_entries')
        .select('amount');
      const totalRevenue = (revenueData || []).reduce((sum, r) => sum + parseFloat(String(r.amount || 0)), 0);
      const paidBookingsCount = revenueData?.length ?? 0;

      setStats(prev => ({
        ...prev,
        activeMusicians: activeMusiciansCount || 0,
        loggedInMusicians: prev.loggedInMusicians || 0,
        activeProjects: activeProjectsCount || 0,
        totalFiles: filesCount || 0,
        totalFileSize,
        totalCollaborators: collaboratorsCount || 0,
        totalMessages: messagesCount || 0,
        totalComments: commentsCount || 0,
        totalRevenue,
        paidBookingsCount,
      }));
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  const loadProjects = async (user?: string, pass?: string) => {
    try {
      const { data, error } = await supabase
        .from('collaboration_projects')
        .select(`
          *,
          collaborators:project_collaborators(count),
          files:project_files(count)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setProjects(data);
      }
    } catch (error: any) {
      console.error('Error loading projects:', error);
    }
  };

  const loadFiles = async (user?: string, pass?: string) => {
    try {
      const { data, error } = await supabase
        .from('project_files')
        .select(`
          *,
          project:collaboration_projects(project_name),
          uploader:musician_profiles(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        setFiles(data);
      }
    } catch (error: any) {
      console.error('Error loading files:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin-logged-in');
    sessionStorage.removeItem('admin-username');
    sessionStorage.removeItem('admin-password');
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    toast.success('Logged out successfully');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'completed':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gold/10 text-gold border-gold/20';
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20">
        <Toaster />
        <Card className="w-full max-w-md bg-secondary/30 border-border/50">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-gold" />
            </div>
            <CardTitle className="text-3xl">Admin Login</CardTitle>
            <CardDescription>Access the Derby Youth Foundation dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full bg-gold text-background hover:bg-gold/90">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Toaster />

      <section className="bg-gradient-to-b from-background to-secondary/20 py-8 sm:py-12 border-b border-border/50">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Admin <span className="text-gold">Dashboard</span>
              </h1>
              <p className="text-muted-foreground">Manage bookings and content</p>
            </div>
            <Button onClick={handleLogout} variant="outline" className="border-gold/50 hover:bg-gold/10">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-3 sm:px-4 py-6 sm:py-12 pb-24 sm:pb-12 scroll-mt-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card className="bg-gradient-to-br from-secondary/30 to-secondary/50 border-gold/50 hover:border-gold transition-all shadow-lg hover:shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Logged In Musicians</CardTitle>
              <div className="h-10 w-10 rounded-full bg-gold/10 flex items-center justify-center relative">
                <Users className="h-5 w-5 text-gold" />
                {stats.loggedInMusicians > 0 && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gold mb-1">{stats.loggedInMusicians}</div>
              <p className="text-xs text-muted-foreground">
                Currently logged in
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/30 to-secondary/50 border-primary/50 hover:border-primary transition-all shadow-lg hover:shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FolderOpen className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-1">{stats.activeProjects}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalCollaborators} collaborators
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/30 to-secondary/50 border-accent/50 hover:border-accent transition-all shadow-lg hover:shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Files Shared</CardTitle>
              <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Upload className="h-5 w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent mb-1">{stats.totalFiles}</div>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(stats.totalFileSize)} total
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/30 to-secondary/50 border-green-500/50 hover:border-green-500 transition-all shadow-lg hover:shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500 mb-1">
                £{stats.totalRevenue.toFixed(0)}
              </div>
              <p className="text-xs text-muted-foreground">
                From {stats.paidBookingsCount} paid bookings
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          <Card className="bg-secondary/30 border-border/50 hover:border-gold/50 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
              <Package className="h-5 w-5 text-gold/50" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gold">{bookings.length + studioBookings.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {bookings.filter(b => b.status === 'pending').length + 
                 studioBookings.filter(b => b.booking_status === 'pending').length} pending
              </p>
            </CardContent>
          </Card>

          <Card className="bg-secondary/30 border-gold/50 hover:border-gold transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Musicians</CardTitle>
              <Users className="h-5 w-5 text-gold/50" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gold">
                {musicians.filter(m => !m.is_verified && m.is_verified !== null).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card className="bg-secondary/30 border-border/50 hover:border-primary/50 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Messages</CardTitle>
              <MessageSquare className="h-5 w-5 text-primary/50" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalMessages}</div>
              <p className="text-xs text-muted-foreground mt-1">Project chat messages</p>
            </CardContent>
          </Card>

          <Card className="bg-secondary/30 border-border/50 hover:border-accent/50 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Comments</CardTitle>
              <MessageSquare className="h-5 w-5 text-accent/50" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.totalComments}</div>
              <p className="text-xs text-muted-foreground mt-1">Project comments</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="flex sm:grid w-full max-w-4xl sm:grid-cols-3 lg:grid-cols-6 mb-6 sm:mb-8 text-xs sm:text-sm gap-1 p-1 overflow-x-auto overscroll-x-contain shrink-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <TabsTrigger value="overview" className="flex-shrink-0">Overview</TabsTrigger>
            <TabsTrigger value="bookings" className="flex-shrink-0">Bookings</TabsTrigger>
            <TabsTrigger value="musicians" className="flex-shrink-0">
              Musicians
              {musicians.filter(m => !m.is_verified).length > 0 && (
                <Badge className="ml-2 bg-gold text-background" variant="secondary">
                  {musicians.filter(m => !m.is_verified).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex-shrink-0">
              Projects
              {stats.activeProjects > 0 && (
                <Badge className="ml-2 bg-primary text-background" variant="secondary">
                  {stats.activeProjects}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="files" className="flex-shrink-0">
              Files
              {stats.totalFiles > 0 && (
                <Badge className="ml-2 bg-accent text-background" variant="secondary">
                  {stats.totalFiles}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex-shrink-0">
              <CalendarX2 className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Calendar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4 sm:mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-secondary/30 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-gold" />
                    Platform Activity
                  </CardTitle>
                  <CardDescription>Recent activity across the platform</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-gold" />
                      <div>
                        <p className="font-medium">Logged In Musicians</p>
                        <p className="text-sm text-muted-foreground">Currently active users</p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gold">{stats.loggedInMusicians}</div>
                  </div>
                  {loggedInMusicians.length > 0 && (
                    <div className="mt-2 p-3 bg-background/30 rounded-lg border border-gold/20">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Active Now:</p>
                      <div className="flex flex-wrap gap-2">
                        {loggedInMusicians.slice(0, 5).map((musician) => (
                          <Badge key={musician.id} variant="outline" className="border-gold/50 text-xs">
                            {musician.full_name}
                          </Badge>
                        ))}
                        {loggedInMusicians.length > 5 && (
                          <Badge variant="outline" className="border-gold/50 text-xs">
                            +{loggedInMusicians.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FolderOpen className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Active Projects</p>
                        <p className="text-sm text-muted-foreground">Collaboration projects</p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-primary">{stats.activeProjects}</div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Upload className="h-5 w-5 text-accent" />
                      <div>
                        <p className="font-medium">Files Shared</p>
                        <p className="text-sm text-muted-foreground">{formatFileSize(stats.totalFileSize)} total</p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-accent">{stats.totalFiles}</div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Messages & Comments</p>
                        <p className="text-sm text-muted-foreground">Total interactions</p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-green-500">{stats.totalMessages + stats.totalComments}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-secondary/30 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-gold" />
                    Revenue Overview
                  </CardTitle>
                  <CardDescription>Financial performance metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-gold/10 to-gold/5 rounded-lg border border-gold/20">
                    <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-gold">
                      £{stats.totalRevenue.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Stripe confirmed payments only</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-background/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Total Bookings</p>
                      <p className="text-xl font-bold">{bookings.length + studioBookings.length}</p>
                    </div>
                    <div className="p-3 bg-background/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Pending</p>
                      <p className="text-xl font-bold text-orange-500">
                        {bookings.filter(b => b.status === 'pending').length + 
                         studioBookings.filter(b => b.booking_status === 'pending').length}
                      </p>
                    </div>
                    <div className="p-3 bg-background/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Confirmed</p>
                      <p className="text-xl font-bold text-green-500">
                        {bookings.filter(b => b.status === 'confirmed').length + 
                         studioBookings.filter(b => b.booking_status === 'confirmed').length}
                      </p>
                    </div>
                    <div className="p-3 bg-background/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Completed</p>
                      <p className="text-xl font-bold text-primary">
                        {bookings.filter(b => b.status === 'completed').length + 
                         studioBookings.filter(b => b.booking_status === 'completed').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6 mt-4 sm:mt-6">
            <Card className="bg-secondary/30 border-border/50">
              <CardHeader>
                <CardTitle className="text-2xl">Recent Bookings</CardTitle>
                <CardDescription>View and manage all customer bookings. Click on any booking to see details.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">Loading bookings...</p>
                ) : bookings.length === 0 && studioBookings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No bookings yet</p>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-gold">Type</TableHead>
                            <TableHead className="text-gold">Booking #</TableHead>
                            <TableHead className="text-gold">Customer</TableHead>
                            <TableHead className="text-gold">Email</TableHead>
                            <TableHead className="text-gold">Date</TableHead>
                            <TableHead className="text-gold">Total</TableHead>
                            <TableHead className="text-gold">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...bookings, ...studioBookings]
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .map((booking) => {
                              const bookingStatus = booking.status || booking.booking_status || 'pending';
                              const bookingTotal = booking.total || booking.package_price || 0;

                              return (
                                <TableRow 
                                  key={booking.id}
                                  className="cursor-pointer hover:bg-secondary/50"
                                  onClick={() => loadBookingDetails(booking.id, booking.booking_type || 'equipment')}
                                >
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                      {booking.booking_type === 'studio' ? 'Studio' : 'Equipment'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">{booking.booking_number || `ID: ${booking.id.substring(0, 8)}`}</TableCell>
                                  <TableCell className="font-medium">{booking.customer_name}</TableCell>
                                  <TableCell className="text-muted-foreground">{booking.customer_email}</TableCell>
                                  <TableCell>{new Date(booking.booking_date).toLocaleDateString()}</TableCell>
                                  <TableCell className="font-bold">£{parseFloat(bookingTotal.toString()).toFixed(2)}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className={getStatusColor(bookingStatus)}>
                                      {bookingStatus}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card Layout */}
                    <div className="md:hidden space-y-3">
                      {[...bookings, ...studioBookings]
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((booking) => {
                          const bookingStatus = booking.status || booking.booking_status || 'pending';
                          const bookingTotal = booking.total || booking.package_price || 0;

                          return (
                            <Card
                              key={booking.id}
                              className="bg-secondary/30 border-border/50 cursor-pointer hover:border-gold/50 transition-all touch-target"
                              onClick={() => loadBookingDetails(booking.id, booking.booking_type || 'equipment')}
                            >
                              <CardContent className="p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant="outline" className="text-xs">
                                        {booking.booking_type === 'studio' ? 'Studio' : 'Equipment'}
                                      </Badge>
                                      <Badge variant="outline" className={getStatusColor(bookingStatus)}>
                                        {bookingStatus}
                                      </Badge>
                                    </div>
                                    <p className="font-medium text-base mb-1">{booking.customer_name}</p>
                                    <p className="text-sm text-muted-foreground break-words">{booking.customer_email}</p>
                                  </div>
                                  <div className="text-right shrink-0 ml-4">
                                    <p className="text-lg font-bold text-gold">£{parseFloat(bookingTotal.toString()).toFixed(2)}</p>
                                  </div>
                                </div>
                                <div className="pt-2 border-t border-border/50 space-y-1">
                                  <p className="text-xs text-muted-foreground">
                                    <span className="font-medium">Booking:</span> {booking.booking_number || `ID: ${booking.id.substring(0, 8)}`}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    <span className="font-medium">Date:</span> {new Date(booking.booking_date).toLocaleDateString()}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Booking Details Dialog */}
            <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)] sm:w-full">
                {selectedBooking && (
                  <>
                    <DialogHeader>
                      <DialogTitle className="text-2xl flex items-center gap-2">
                        <Package className="h-6 w-6 text-gold" />
                        Booking Details
                        <Badge variant="outline" className="ml-2">
                          {selectedBooking.booking_type === 'studio' ? 'Studio Session' : 'Equipment Rental'}
                        </Badge>
                      </DialogTitle>
                      <DialogDescription>
                        {selectedBooking.booking_number || `ID: ${selectedBooking.id.substring(0, 8)}`}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 mt-4">
                      {/* Customer Information */}
                      <div className="bg-secondary/50 p-4 rounded-lg border border-border">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <Users className="h-5 w-5 text-gold" />
                          Customer Information
                        </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium break-words">{selectedBooking.customer_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium break-words">{selectedBooking.customer_email}</p>
                      </div>
                      {selectedBooking.customer_phone && (
                        <div className="sm:col-span-2">
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium break-words">{selectedBooking.customer_phone}</p>
                        </div>
                      )}
                    </div>
                      </div>

                      {/* Booking Details */}
                      <div className="bg-secondary/50 p-4 rounded-lg border border-border">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-gold" />
                          Booking Details
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Booking Date</p>
                            <p className="font-medium break-words">{new Date(selectedBooking.booking_date).toLocaleDateString('en-GB', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}</p>
                          </div>
                          
                          {selectedBooking.booking_type === 'studio' && selectedBooking.booking_time && (
                            <div>
                              <p className="text-sm text-muted-foreground">Time</p>
                              <p className="font-medium">{selectedBooking.booking_time}</p>
                            </div>
                          )}

                          {selectedBooking.booking_type === 'equipment' && selectedBooking.booking_time && (
                            <div>
                              <p className="text-sm text-muted-foreground">Collection Time</p>
                              <p className="font-medium">{selectedBooking.booking_time}</p>
                            </div>
                          )}

                          {selectedBooking.booking_type === 'studio' && selectedBooking.session_hours && (
                            <div>
                              <p className="text-sm text-muted-foreground">Session Duration</p>
                              <p className="font-medium">{selectedBooking.session_hours} hour{selectedBooking.session_hours > 1 ? 's' : ''}</p>
                            </div>
                          )}

                          {selectedBooking.booking_type === 'equipment' && selectedBooking.duration_days && (
                            <div>
                              <p className="text-sm text-muted-foreground">Rental Duration</p>
                              <p className="font-medium">{selectedBooking.duration_days} day{selectedBooking.duration_days > 1 ? 's' : ''}</p>
                            </div>
                          )}

                          <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <Badge variant="outline" className={getStatusColor(selectedBooking.status || selectedBooking.booking_status || 'pending')}>
                              {selectedBooking.status || selectedBooking.booking_status || 'pending'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Equipment/Service Booked */}
                      <div className="bg-secondary/50 p-4 rounded-lg border border-border">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          {selectedBooking.booking_type === 'studio' ? (
                            <>
                              <Music className="h-5 w-5 text-gold" />
                              Service Booked
                            </>
                          ) : (
                            <>
                              <Package className="h-5 w-5 text-gold" />
                              Equipment Booked
                            </>
                          )}
                        </h3>
                        
                        {selectedBooking.booking_type === 'studio' ? (
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm text-muted-foreground">Package/Service</p>
                              <p className="font-medium text-lg">{selectedBooking.package_name || 'Studio Session'}</p>
                            </div>
                            {selectedBooking.special_requests && (
                              <div className="mt-3">
                                <p className="text-sm text-muted-foreground">Special Requests</p>
                                <p className="font-medium">{selectedBooking.special_requests}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {selectedBooking.items && Array.isArray(selectedBooking.items) && selectedBooking.items.length > 0 ? (
                              selectedBooking.items.map((item: any, index: number) => {
                                const itemPrice = item.price || 0;
                                const itemQuantity = item.quantity || 1;
                                const itemDuration = item.duration || selectedBooking.duration_days || 1;
                                const itemTotal = item.total || (itemPrice * itemDuration * itemQuantity);
                                
                                return (
                                  <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                                    <div>
                                      <p className="font-medium">{item.name || item.item_name || 'Unknown Item'}</p>
                                      <div className="text-sm text-muted-foreground space-y-1 mt-1">
                                        {itemQuantity > 1 && (
                                          <p>Quantity: {itemQuantity}</p>
                                        )}
                                        {itemDuration && (
                                          <p>Duration: {itemDuration} day{itemDuration > 1 ? 's' : ''}</p>
                                        )}
                                        <p>Price: £{itemPrice.toFixed(2)}/day × {itemQuantity} × {itemDuration} day{itemDuration > 1 ? 's' : ''}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-gold">£{parseFloat(itemTotal.toString()).toFixed(2)}</p>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-muted-foreground">No items found</p>
                            )}
                            {selectedBooking.delivery_cost && selectedBooking.delivery_cost > 0 && (
                              <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border-t border-border">
                                <div>
                                  <p className="font-medium">Delivery</p>
                                  {selectedBooking.delivery_postcode && (
                                    <p className="text-sm text-muted-foreground">To: {selectedBooking.delivery_postcode}</p>
                                  )}
                                </div>
                                <p className="font-bold text-gold">£{parseFloat(selectedBooking.delivery_cost.toString()).toFixed(2)}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Pricing Summary */}
                      <div className="bg-gradient-to-br from-gold/10 to-gold/5 p-4 rounded-lg border border-gold/20">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-gold" />
                          Pricing Summary
                        </h3>
                        <div className="space-y-2">
                          {selectedBooking.booking_type === 'equipment' && selectedBooking.subtotal !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Subtotal</span>
                              <span className="font-medium">£{parseFloat(selectedBooking.subtotal.toString()).toFixed(2)}</span>
                            </div>
                          )}
                          {selectedBooking.booking_type === 'equipment' && selectedBooking.delivery_cost && selectedBooking.delivery_cost > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Delivery</span>
                              <span className="font-medium">£{parseFloat(selectedBooking.delivery_cost.toString()).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-2 border-t border-gold/20">
                            <span className="text-lg font-semibold">Total Amount</span>
                            <span className="text-2xl font-bold text-gold">
                              £{parseFloat((selectedBooking.total || selectedBooking.package_price || 0).toString()).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Collection/Booking Time Summary */}
                      <div className="bg-secondary/50 p-4 rounded-lg border border-border">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-gold" />
                          {selectedBooking.booking_type === 'studio' ? 'Session Schedule' : 'Collection Details'}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              {selectedBooking.booking_type === 'studio' ? 'Session Date' : 'Collection Date'}
                            </p>
                            <p className="font-medium text-lg">
                              {new Date(selectedBooking.booking_date).toLocaleDateString('en-GB', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                          {selectedBooking.booking_type === 'studio' && selectedBooking.booking_time && (
                            <div>
                              <p className="text-sm text-muted-foreground">Session Time</p>
                              <p className="font-medium text-lg">{selectedBooking.booking_time}</p>
                            </div>
                          )}
                          {selectedBooking.booking_type === 'equipment' && selectedBooking.booking_time && (
                            <div>
                              <p className="text-sm text-muted-foreground">Collection Time</p>
                              <p className="font-medium text-lg">{selectedBooking.booking_time}</p>
                            </div>
                          )}
                          {selectedBooking.booking_type === 'studio' && selectedBooking.session_hours && (
                            <div>
                              <p className="text-sm text-muted-foreground">Duration</p>
                              <p className="font-medium text-lg">
                                {selectedBooking.session_hours} hour{selectedBooking.session_hours > 1 ? 's' : ''}
                              </p>
                            </div>
                          )}
                          {selectedBooking.booking_type === 'equipment' && selectedBooking.duration_days && (
                            <div>
                              <p className="text-sm text-muted-foreground">Rental Period</p>
                              <p className="font-medium text-lg">
                                {selectedBooking.duration_days} day{selectedBooking.duration_days > 1 ? 's' : ''}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Send confirmation email - for bookings with PSA-* reference */}
                      {selectedBooking.booking_number?.startsWith('PSA-') && (
                        <div className="bg-secondary/50 p-4 rounded-lg border border-border">
                          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Mail className="h-5 w-5 text-gold" />
                            Send confirmation email
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Edit the details below before sending. The email will use these values.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                              <Label htmlFor="email-customer-name" className="text-xs text-muted-foreground">Customer name</Label>
                              <Input
                                id="email-customer-name"
                                value={emailOverrides.customer_name}
                                onChange={(e) => setEmailOverrides(o => ({ ...o, customer_name: e.target.value }))}
                                placeholder="Customer name"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="email-customer-email" className="text-xs text-muted-foreground">Email address</Label>
                              <Input
                                id="email-customer-email"
                                type="email"
                                value={emailOverrides.customer_email}
                                onChange={(e) => setEmailOverrides(o => ({ ...o, customer_email: e.target.value }))}
                                placeholder="customer@example.com"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="email-booking-date" className="text-xs text-muted-foreground">Booking date</Label>
                              <Input
                                id="email-booking-date"
                                type="date"
                                value={emailOverrides.booking_date}
                                onChange={(e) => setEmailOverrides(o => ({ ...o, booking_date: e.target.value }))}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="email-session-time" className="text-xs text-muted-foreground">
                                {selectedBooking?.booking_type === 'equipment' ? 'Collection time' : 'Session start time'}
                              </Label>
                              <Input
                                id="email-session-time"
                                value={emailOverrides.session_start_time}
                                onChange={(e) => setEmailOverrides(o => ({ ...o, session_start_time: e.target.value }))}
                                placeholder="e.g. 19:45"
                                className="mt-1"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <Label htmlFor="email-service" className="text-xs text-muted-foreground">Service / equipment</Label>
                              <Input
                                id="email-service"
                                value={emailOverrides.service_description}
                                onChange={(e) => setEmailOverrides(o => ({ ...o, service_description: e.target.value }))}
                                placeholder="e.g. 2x SM58 Microphone (3 days), 1x Rehearsal Space (2 hours)"
                                className="mt-1"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <Label htmlFor="email-custom-message" className="text-xs text-muted-foreground">Custom message (optional)</Label>
                              <Textarea
                                id="email-custom-message"
                                value={emailOverrides.custom_message}
                                onChange={(e) => setEmailOverrides(o => ({ ...o, custom_message: e.target.value }))}
                                placeholder="Add any extra note for the customer"
                                className="mt-1 min-h-[80px]"
                                rows={3}
                              />
                            </div>
                          </div>
                          <Button
                            onClick={() => sendConfirmationEmail(selectedBooking.booking_number!, emailOverrides)}
                            disabled={sendEmailLoading || !emailOverrides.customer_email}
                            className="border-gold/50 hover:bg-gold/10 w-full sm:w-auto"
                          >
                            {sendEmailLoading ? 'Sending...' : 'Send confirmation email'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="musicians" className="space-y-6 mt-4 sm:mt-6">
            <Card className="bg-secondary/30 border-border/50">
              <CardHeader>
                <CardTitle className="text-2xl">Musician Profile Approvals</CardTitle>
                <CardDescription>Review and approve musician profiles to make them visible to customers</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">Loading musician profiles...</p>
                ) : musicians.filter(m => !m.is_verified).length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending musician approvals</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {musicians.filter(m => !m.is_verified).map((musician) => (
                      <div
                        key={musician.id}
                        className="p-4 bg-background/50 rounded-lg border border-border hover:border-gold/50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <Avatar className="h-16 w-16 border-2 border-gold">
                            <AvatarImage src={musician.profile_photo_url} />
                            <AvatarFallback className="bg-gold/20 text-gold text-lg">
                              {musician.full_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-xl font-semibold">{musician.full_name}</h3>
                                <p className="text-gold font-medium">{musician.role}</p>
                                <p className="text-sm text-muted-foreground">{musician.email}</p>
                              </div>
                              <Badge variant="outline" className="border-gold/50 text-gold">
                                Pending Review
                              </Badge>
                            </div>

                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {musician.bio}
                            </p>

                            <div className="flex gap-2 flex-wrap mb-3">
                              {musician.skills.slice(0, 5).map((skill, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {skill.skill_name}
                                </Badge>
                              ))}
                              {musician.skills.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{musician.skills.length - 5} more
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-4 mb-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Hourly: </span>
                                <span className="font-semibold text-gold">£{musician.hourly_rate}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Session: </span>
                                <span className="font-semibold text-gold">£{musician.session_rate}</span>
                              </div>
                              <div className="text-muted-foreground">
                                Applied: {new Date(musician.created_at).toLocaleDateString()}
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="border-gold/50 hover:bg-gold/10"
                                    onClick={() => setSelectedMusician(musician)}
                                  >
                                    View Full Profile
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                  {selectedMusician && selectedMusician.id === musician.id && (
                                    <>
                                      <DialogHeader>
                                        <DialogTitle className="text-2xl">{selectedMusician.full_name}</DialogTitle>
                                        <DialogDescription className="text-lg font-semibold">
                                          {selectedMusician.role}
                                        </DialogDescription>
                                      </DialogHeader>

                                      <div className="space-y-6">
                                        {selectedMusician.profile_photo_url && (
                                          <div className="relative h-64 w-full rounded-lg overflow-hidden">
                                            <div
                                              className="absolute inset-0 bg-cover bg-center"
                                              style={{
                                                backgroundImage: `url(${selectedMusician.profile_photo_url})`
                                              }}
                                            />
                                          </div>
                                        )}

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
                                          <h3 className="text-lg font-semibold mb-2">Contact Information</h3>
                                          <p className="text-muted-foreground">{selectedMusician.email}</p>
                                        </div>

                                        <div className="border-t border-border pt-4">
                                          <h3 className="text-lg font-semibold mb-3">Rates</h3>
                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-secondary/50 p-4 rounded-lg">
                                              <div className="text-sm text-muted-foreground mb-1">Hourly Rate</div>
                                              <div className="text-2xl font-bold text-gold">£{selectedMusician.hourly_rate}</div>
                                            </div>
                                            <div className="bg-secondary/50 p-4 rounded-lg">
                                              <div className="text-sm text-muted-foreground mb-1">Session Rate</div>
                                              <div className="text-2xl font-bold text-gold">£{selectedMusician.session_rate}</div>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                          <Button
                                            onClick={() => handleApproveMusician(selectedMusician.id)}
                                            className="flex-1 bg-gold text-background hover:bg-gold/90"
                                          >
                                            <Check className="mr-2 h-4 w-4" />
                                            Approve Profile
                                          </Button>
                                          <Button
                                            onClick={() => handleRejectMusician(selectedMusician.id)}
                                            variant="outline"
                                            className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
                                          >
                                            <X className="mr-2 h-4 w-4" />
                                            Reject
                                          </Button>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </DialogContent>
                              </Dialog>

                              <Button
                                onClick={() => handleApproveMusician(musician.id)}
                                className="bg-gold text-background hover:bg-gold/90"
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleRejectMusician(musician.id)}
                                variant="outline"
                                className="border-destructive/50 text-destructive hover:bg-destructive/10"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-secondary/30 border-border/50">
              <CardHeader>
                <CardTitle className="text-2xl">Verified Musicians</CardTitle>
                <CardDescription>Musicians approved and visible to customers</CardDescription>
              </CardHeader>
              <CardContent>
                {musicians.filter(m => m.is_verified).length === 0 ? (
                  <div className="text-center py-12">
                    <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No verified musicians yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {musicians.filter(m => m.is_verified).map((musician) => (
                      <div
                        key={musician.id}
                        className="p-4 bg-background/50 rounded-lg border border-border flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 border-2 border-gold">
                            <AvatarImage src={musician.profile_photo_url} />
                            <AvatarFallback className="bg-gold/20 text-gold">
                              {musician.full_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold">{musician.full_name}</h4>
                            <p className="text-sm text-gold">{musician.role}</p>
                          </div>
                        </div>
                        <Badge className="bg-gold text-background">Verified</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6 mt-4 sm:mt-6">
            <Card className="bg-secondary/30 border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <FolderOpen className="h-6 w-6 text-primary" />
                      Collaboration Projects
                    </CardTitle>
                    <CardDescription>Manage and monitor active collaboration projects</CardDescription>
                  </div>
                  <Badge className="bg-primary text-background">
                    {stats.activeProjects} Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No projects yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="p-4 bg-background/50 rounded-lg border border-border hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-1">{project.project_name}</h3>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {project.description || 'No description'}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {project.collaborators?.[0]?.count || 0} collaborators
                              </span>
                              <span className="flex items-center gap-1">
                                <Upload className="h-4 w-4" />
                                {project.files?.[0]?.count || 0} files
                              </span>
                              <span>
                                Created: {new Date(project.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={`ml-4 ${
                              project.status === 'active'
                                ? 'border-green-500/50 text-green-500'
                                : project.status === 'completed'
                                ? 'border-primary/50 text-primary'
                                : 'border-gray-500/50 text-gray-500'
                            }`}
                          >
                            {project.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="space-y-6 mt-4 sm:mt-6">
            <Card className="bg-secondary/30 border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Upload className="h-6 w-6 text-accent" />
                      Shared Files
                    </CardTitle>
                    <CardDescription>All files shared across collaboration projects</CardDescription>
                  </div>
                  <Badge className="bg-accent text-background">
                    {stats.totalFiles} Files • {formatFileSize(stats.totalFileSize)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {files.length === 0 ? (
                  <div className="text-center py-12">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No files shared yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="p-4 bg-background/50 rounded-lg border border-border hover:border-accent/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                              <FileText className="h-6 w-6 text-accent" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold truncate">{file.file_name}</h4>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <span>{formatFileSize(file.file_size || 0)}</span>
                                <span>•</span>
                                <span>Project: {file.project?.project_name || 'Unknown'}</span>
                                <span>•</span>
                                <span>Uploaded by: {file.uploader?.full_name || 'Unknown'}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(file.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          {file.is_latest_version && (
                            <Badge variant="outline" className="border-accent/50 text-accent ml-4">
                              v{file.version_number}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6 mt-4 sm:mt-6">
            <Card className="bg-secondary/30 border-border/50 overflow-hidden">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-lg sm:text-2xl flex items-center gap-2">
                      <CalendarX2 className="h-5 w-5 sm:h-6 sm:w-6 text-gold shrink-0" />
                      Blocked Slots (Date & Time)
                    </CardTitle>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2 min-h-[44px]">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 sm:h-9 sm:w-9 touch-manipulation"
                      onClick={() => {
                        const [y, m] = calendarMonth.split('-').map(Number);
                        const prev = m === 1 ? new Date(y - 1, 11) : new Date(y, m - 2);
                        setCalendarMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`);
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-base sm:text-lg font-semibold min-w-[120px] sm:min-w-[140px] text-center">
                      {new Date(calendarMonth + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 sm:h-9 sm:w-9 touch-manipulation"
                      onClick={() => {
                        const [y, m] = calendarMonth.split('-').map(Number);
                        const next = m === 12 ? new Date(y + 1, 0) : new Date(y, m);
                        setCalendarMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                {blockedSlotsLoading && (
                  <p className="text-sm text-muted-foreground">Updating...</p>
                )}
                <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-center text-[10px] sm:text-sm -mx-1 sm:mx-0">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                    <div key={d} className="font-medium text-muted-foreground py-1.5 sm:py-2 truncate">
                      {d.slice(0, 1)}
                    </div>
                  ))}
                  {(() => {
                    const [year, month] = calendarMonth.split('-').map(Number);
                    const first = new Date(year, month - 1, 1);
                    const last = new Date(year, month, 0);
                    const startPad = (first.getDay() + 6) % 7;
                    const daysInMonth = last.getDate();
                    const todayStart = new Date();
                    todayStart.setHours(0, 0, 0, 0);
                    const cells: React.ReactNode[] = [];
                    for (let i = 0; i < startPad; i++) {
                      cells.push(<div key={`pad-${i}`} className="min-h-[36px] sm:min-h-[40px]" />);
                    }
                    for (let d = 1; d <= daysInMonth; d++) {
                      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                      const isPast = new Date(dateStr) < todayStart;
                      const blockedCount = blockedCountForDate(dateStr);
                      const bookedCount = bookedCountForDate(dateStr);
                      const isFullyBlocked = blockedCount === BUSINESS_HOURS.length;
                      const isAvailable = !isPast && blockedCount === 0;
                      const isExpanded = expandedDate === dateStr;
                      const hasBookings = bookedCount > 0;
                      cells.push(
                        <div key={dateStr}>
                          <button
                            type="button"
                            onClick={() => handleDateClick(dateStr, isPast, isExpanded)}
                            disabled={isPast}
                            className={`w-full min-h-[36px] sm:min-h-[40px] rounded-md sm:rounded-lg transition-colors duration-150 font-medium text-xs sm:text-sm touch-manipulation select-none
                              ${isAvailable
                                ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/50 hover:bg-green-500/30'
                                : isFullyBlocked
                                  ? 'bg-destructive/20 text-destructive line-through border border-destructive/50'
                                  : blockedCount > 0
                                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/50'
                                    : isPast
                                      ? 'bg-muted/30 text-muted-foreground cursor-not-allowed'
                                      : 'bg-background/50 hover:bg-gold/20 border border-transparent'
                              } ${isExpanded ? 'ring-2 ring-gold ring-offset-2 ring-offset-background' : ''} ${!isPast ? 'cursor-pointer' : ''}`}
                          >
                            <span className="relative inline-block">
                              {d}
                              {hasBookings && !isPast && (
                                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary" title={`${bookedCount} booked`} />
                              )}
                            </span>
                          </button>
                        </div>
                      );
                    }
                    return cells;
                  })()}
                </div>

                {expandedDate && (() => {
                  const [year, month] = calendarMonth.split('-').map(Number);
                  const todayStart = new Date();
                  todayStart.setHours(0, 0, 0, 0);
                  const isPast = new Date(expandedDate) < todayStart;
                  if (isPast) return null;
                  return (
                    <div className="mt-5 sm:mt-6 p-4 sm:p-5 bg-background/50 rounded-xl border border-border/50">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3 sm:mb-4">
                        Time slots for {new Date(expandedDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3 sm:mb-4">Tap to block/unblock. Blue = customer booking.</p>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3 max-h-[280px] overflow-y-auto overscroll-contain pr-1">
                        {BUSINESS_HOURS.map((timeStr) => {
                          const slotBlocked = isSlotBlocked(expandedDate, timeStr);
                          const slotBooked = isSlotBookedByCustomer(expandedDate, timeStr);
                          return (
                            <button
                              key={timeStr}
                              type="button"
                              disabled={slotBooked}
                              onClick={() => !blockedSlotsLoading && !slotBooked && toggleBlockedSlot(expandedDate, timeStr)}
                              className={`min-h-[48px] sm:min-h-[44px] text-sm font-medium rounded-lg transition-colors duration-150 touch-manipulation select-none flex items-center justify-center
                                ${slotBooked
                                  ? 'bg-primary/20 text-primary cursor-default border-2 border-primary/40'
                                  : slotBlocked
                                    ? 'bg-destructive/20 text-destructive line-through hover:bg-destructive/30 border-2 border-destructive/50'
                                    : 'bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30 border-2 border-green-500/40'
                                } ${!slotBooked ? 'cursor-pointer' : ''}`}
                              title={slotBooked ? 'Customer booking' : slotBlocked ? 'Blocked' : 'Available'}
                            >
                              {timeStr}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
