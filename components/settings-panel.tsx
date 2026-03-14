"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { DollarSign, FileText, Save, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import EditableProfilePhoto from '@/components/editable-profile-photo';

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
}

interface SettingsPanelProps {
  profile: MusicianProfile;
  onProfileUpdate: () => void;
}

export default function SettingsPanel({ profile, onProfileUpdate }: SettingsPanelProps) {
  const [bio, setBio] = useState(profile.bio || '');
  const [hourlyRate, setHourlyRate] = useState(profile.hourly_rate?.toString() || '0');
  const [sessionRate, setSessionRate] = useState(profile.session_rate?.toString() || '0');
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    const hourlyRateNum = parseFloat(hourlyRate);
    const sessionRateNum = parseFloat(sessionRate);

    if (isNaN(hourlyRateNum) || hourlyRateNum < 0) {
      toast.error('Please enter a valid hourly rate');
      return;
    }

    if (isNaN(sessionRateNum) || sessionRateNum < 0) {
      toast.error('Please enter a valid session rate');
      return;
    }

    if (bio.length > 1000) {
      toast.error('Bio must be less than 1000 characters');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('musician_profiles')
        .update({
          bio: bio.trim(),
          hourly_rate: hourlyRateNum,
          session_rate: sessionRateNum
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Profile updated successfully!');
      onProfileUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    return (
      bio !== (profile.bio || '') ||
      parseFloat(hourlyRate) !== (profile.hourly_rate || 0) ||
      parseFloat(sessionRate) !== (profile.session_rate || 0)
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">Manage your profile and preferences</p>
      </div>

      <Card className="bg-secondary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-gold" />
            Profile Information
          </CardTitle>
          <CardDescription>Update your public profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center gap-3">
              <EditableProfilePhoto
                profileId={profile.id}
                userId={profile.user_id}
                currentPhotoUrl={profile.profile_photo_url}
                fullName={profile.full_name}
                size="lg"
                editable={true}
                onPhotoUpdate={onProfileUpdate}
              />
              <p className="text-xs text-muted-foreground text-center">
                Max 5MB • JPG, PNG, GIF
              </p>
            </div>

            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Full Name</Label>
                  <p className="text-lg font-semibold">{profile.full_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Role</Label>
                  <p className="text-lg font-semibold">{profile.role}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Email</Label>
                <p className="text-lg font-semibold">{profile.email}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <Label htmlFor="bio" className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-gold" />
              Bio
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other musicians about yourself, your experience, and what you bring to collaborations..."
              rows={6}
              maxLength={1000}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2 text-right">
              {bio.length} / 1000 characters
            </p>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-4 w-4 text-gold" />
              <Label className="text-base">Rates</Label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="hourlyRate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="pl-7"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Rate per hour for studio work
                </p>
              </div>
              <div>
                <Label htmlFor="sessionRate">Session Rate ($)</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="sessionRate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={sessionRate}
                    onChange={(e) => setSessionRate(e.target.value)}
                    className="pl-7"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Flat rate per session
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              {hasChanges() ? 'You have unsaved changes' : 'All changes saved'}
            </p>
            <Button
              onClick={handleSaveProfile}
              disabled={!hasChanges() || saving}
              className="bg-gold text-background hover:bg-gold/90"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-secondary/30">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your account details and statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-background/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Account Status</p>
              <p className="text-lg font-semibold text-gold">Active</p>
            </div>
            <div className="p-4 bg-background/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="text-lg font-semibold">
                {new Date(profile.id).toLocaleDateString()}
              </p>
            </div>
            <div className="p-4 bg-background/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Profile Visibility</p>
              <p className="text-lg font-semibold">Public</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
