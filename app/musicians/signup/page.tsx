"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Music, User, Tags, CheckCircle2, X, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';

const AVAILABLE_SKILLS = [
  'Jazz', 'Gospel', 'R&B', 'Hip Hop', 'Pop', 'Rock', 'Classical',
  'Sight-reading', 'Music Theory', 'Composition', 'Arrangement',
  'Live Performance', 'Studio Recording', 'Music Production',
  'Beat Making', 'Mixing', 'Mastering', 'Sound Design'
];

const MUSICIAN_ROLES = [
  'Drummer', 'Bassist', 'Guitarist', 'Keyboardist', 'Vocalist',
  'Producer', 'DJ', 'Composer', 'Arranger', 'Engineer',
  'Session Musician', 'Multi-Instrumentalist'
];

export default function MusicianSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [role, setRole] = useState('');
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [sessionRate, setSessionRate] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const progress = (step / 3) * 100;

  const handleNextStep = () => {
    if (step === 1) {
      if (!email || !password || !fullName) {
        toast.error('Please fill in all required fields');
        return;
      }
      if (password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    }

    if (step === 2) {
      if (!role || !bio || !hourlyRate || !sessionRate) {
        toast.error('Please fill in all required fields');
        return;
      }
    }

    setStep(step + 1);
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
  };

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleSubmit = async () => {
    if (selectedSkills.length === 0) {
      toast.error('Please select at least one skill');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('User creation failed');
      }

      const { error: profileError } = await supabase.from('musician_profiles').insert({
        user_id: authData.user.id,
        full_name: fullName,
        email,
        role,
        bio,
        hourly_rate: parseFloat(hourlyRate),
        session_rate: parseFloat(sessionRate),
        profile_photo_url: profilePhoto,
        is_verified: false,
        is_active: true,
        open_to_collaboration: false,
      });

      if (profileError) throw profileError;

      const { data: profileData } = await supabase
        .from('musician_profiles')
        .select('id')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      if (profileData) {
        const skillsToInsert = selectedSkills.map(skill => ({
          musician_id: profileData.id,
          skill_name: skill,
        }));

        const { error: skillsError } = await supabase
          .from('musician_skills')
          .insert(skillsToInsert);

        if (skillsError) throw skillsError;
      }

      toast.success('Profile created successfully! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/musician/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Error creating profile:', error);
      toast.error(error.message || 'Failed to create profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Toaster />

      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Join as a <span className="text-gold">Musician</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Create your profile and start getting booked
            </p>
          </div>

          <div className="mb-8">
            <div className="w-full bg-secondary rounded-full h-2 mb-4">
              <div
                className="bg-gold h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-4">
              <div className={`flex items-center gap-2 ${step >= 1 ? 'text-gold' : 'text-muted-foreground'}`}>
                <User className="h-5 w-5" />
                <span className="text-sm font-medium">Account</span>
              </div>
              <div className={`flex items-center gap-2 ${step >= 2 ? 'text-gold' : 'text-muted-foreground'}`}>
                <Music className="h-5 w-5" />
                <span className="text-sm font-medium">Profile</span>
              </div>
              <div className={`flex items-center gap-2 ${step >= 3 ? 'text-gold' : 'text-muted-foreground'}`}>
                <Tags className="h-5 w-5" />
                <span className="text-sm font-medium">Skills</span>
              </div>
            </div>
          </div>

          <Card className="bg-secondary/30 border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl">
                {step === 1 && 'Create Your Account'}
                {step === 2 && 'Build Your Profile'}
                {step === 3 && 'Select Your Skills'}
              </CardTitle>
              <CardDescription>
                {step === 1 && 'Enter your basic account information'}
                {step === 2 && 'Tell us about your musical expertise'}
                {step === 3 && 'Choose skills that match your abilities'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="role">Your Role *</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select your primary role" />
                      </SelectTrigger>
                      <SelectContent>
                        {MUSICIAN_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio *</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell clients about your experience, style, and what makes you unique..."
                      className="mt-1"
                      rows={5}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hourlyRate">Hourly Rate (£) *</Label>
                      <Input
                        id="hourlyRate"
                        type="number"
                        min="0"
                        step="0.01"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        placeholder="50.00"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sessionRate">Session Rate (£) *</Label>
                      <Input
                        id="sessionRate"
                        type="number"
                        min="0"
                        step="0.01"
                        value={sessionRate}
                        onChange={(e) => setSessionRate(e.target.value)}
                        placeholder="200.00"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="profilePhoto">Profile Photo URL</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="profilePhoto"
                        value={profilePhoto}
                        onChange={(e) => setProfilePhoto(e.target.value)}
                        placeholder="https://example.com/photo.jpg"
                      />
                      <Button variant="outline" size="icon">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Optional: Add a professional photo to increase bookings
                    </p>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label>Selected Skills ({selectedSkills.length})</Label>
                    <div className="flex flex-wrap gap-2 mt-2 min-h-[60px] p-3 border rounded-lg bg-background/50">
                      {selectedSkills.length === 0 ? (
                        <span className="text-sm text-muted-foreground">No skills selected yet</span>
                      ) : (
                        selectedSkills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="default"
                            className="bg-gold text-background hover:bg-gold/90 cursor-pointer"
                            onClick={() => toggleSkill(skill)}
                          >
                            {skill}
                            <X className="ml-1 h-3 w-3" />
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Available Skills</Label>
                    <div className="flex flex-wrap gap-2 mt-2 p-3 border rounded-lg bg-background/50 max-h-[400px] overflow-y-auto">
                      {AVAILABLE_SKILLS.map((skill) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className={`cursor-pointer ${
                            selectedSkills.includes(skill)
                              ? 'opacity-50 line-through'
                              : 'hover:bg-gold/10 hover:border-gold'
                          }`}
                          onClick={() => !selectedSkills.includes(skill) && toggleSkill(skill)}
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                {step > 1 && (
                  <Button
                    variant="outline"
                    onClick={handlePreviousStep}
                    className="flex-1 border-gold/50 hover:bg-gold/10"
                  >
                    Previous
                  </Button>
                )}
                {step < 3 ? (
                  <Button
                    onClick={handleNextStep}
                    className="flex-1 bg-gold text-background hover:bg-gold/90"
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-gold text-background hover:bg-gold/90"
                  >
                    {isSubmitting ? (
                      'Creating Profile...'
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Complete Registration
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <a href="/musicians/signin" className="text-gold hover:underline">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
