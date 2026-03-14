"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function DebugAuthPage() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setAuthUser(user);

    if (user) {
      const { data: profileData } = await supabase
        .from('musician_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setProfile(profileData);
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-20">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-20">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Debug Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Auth User Status:</h3>
            {authUser ? (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded">
                <p className="text-green-800 dark:text-green-200">✓ Logged in as: {authUser.email}</p>
                <p className="text-sm text-muted-foreground">User ID: {authUser.id}</p>
              </div>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded">
                <p className="text-red-800 dark:text-red-200">✗ Not logged in</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-2">Musician Profile Status:</h3>
            {profile ? (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded space-y-2">
                <p className="text-green-800 dark:text-green-200">✓ Profile exists</p>
                <p className="text-sm">Name: {profile.full_name}</p>
                <p className="text-sm">Role: {profile.role}</p>
                <p className="text-sm">Email: {profile.email}</p>
              </div>
            ) : authUser ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded">
                <p className="text-yellow-800 dark:text-yellow-200">⚠ Profile NOT found</p>
                <p className="text-sm mt-2">You are logged in but don't have a musician profile.</p>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded">
                <p className="text-muted-foreground">No profile (not logged in)</p>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            {authUser && !profile && (
              <Button onClick={() => router.push('/musicians/signup')}>
                Complete Signup
              </Button>
            )}
            {authUser && profile && (
              <Button onClick={() => router.push('/musician/dashboard')}>
                Go to Dashboard
              </Button>
            )}
            {!authUser && (
              <Button onClick={() => router.push('/musicians/signin')}>
                Sign In
              </Button>
            )}
            {authUser && (
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
