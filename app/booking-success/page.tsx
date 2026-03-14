"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ArrowRight, Mail } from 'lucide-react';

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      setTimeout(() => setLoading(false), 1000);
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Confirming your booking...</p>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="text-red-500">Invalid Session</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              No booking session found. Please try booking again.
            </p>
            <Link href="/pricing">
              <Button className="w-full">Return to Pricing</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-500/10 p-6">
                <CheckCircle2 className="h-20 w-20 text-green-500" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">
              Booking <span className="text-gold">Confirmed!</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Your studio session has been successfully booked and paid for.
            </p>
          </div>

          <Card className="bg-secondary/30 border-border/50 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-gold" />
                What Happens Next?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Confirmation Email</h4>
                  <p className="text-sm text-muted-foreground">
                    Check your inbox for a detailed booking confirmation with all the session details.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Studio Preparation</h4>
                  <p className="text-sm text-muted-foreground">
                    Our team will prepare the studio according to your booking specifications.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Reminder & Details</h4>
                  <p className="text-sm text-muted-foreground">
                    You&apos;ll receive a reminder 24 hours before your session with arrival instructions.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Enjoy Your Session</h4>
                  <p className="text-sm text-muted-foreground">
                    Arrive 10 minutes early to get set up and make the most of your studio time.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary/30 border-border/50 mb-8">
            <CardHeader>
              <CardTitle>Important Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Session ID:</strong> {sessionId}
              </p>
              <p>
                <strong className="text-foreground">Cancellation Policy:</strong> Full refund if cancelled 7+ days before booking. 50% refund if cancelled 3-7 days before. No refund within 48 hours of booking.
              </p>
              <p>
                <strong className="text-foreground">Need Changes?</strong> Contact us at least 48 hours before your session to reschedule.
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/" className="flex-1">
              <Button size="lg" variant="outline" className="w-full border-gold/50 hover:bg-gold/10">
                Return Home
              </Button>
            </Link>
            <Link href="/pricing" className="flex-1">
              <Button size="lg" className="w-full bg-gold text-background hover:bg-gold/90">
                Book Another Session
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading booking confirmation...</p>
      </div>
    }>
      <BookingSuccessContent />
    </Suspense>
  );
}
