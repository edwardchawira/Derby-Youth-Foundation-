"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Music2, Mic2, Radio, Award, Users, Headphones, ArrowRight, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden h-[400px] xs:h-[480px] sm:h-[600px] md:h-[700px]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/images/hero-poster.png)'
          }}
        />
        <div className="absolute inset-0 hero-overlay" />

        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground text-sm font-medium shadow-lg">
              Empowering the next generation
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-tight drop-shadow-lg px-4 text-white">
              Supporting young people to thrive.
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/95 max-w-2xl mx-auto drop-shadow-md px-4">
              Spaces, opportunities and creative programmes so every young person in Derby can grow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/equipment" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 px-8 shadow-lg min-h-[48px]">
                  View Equipment
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/studio" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-secondary bg-secondary/20 backdrop-blur-sm hover:bg-secondary/40 text-primary-foreground px-8 min-h-[48px]">
                  Studio Services
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6">About <span className="text-gold">Derby Youth Foundation</span></h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Derby Youth Foundation is a CIC (community interest company) dedicated to empowering young people in Derby and the wider Midlands. We provide creative spaces, studio access, equipment and opportunities so that every young person can explore their potential, develop skills and grow. Our mission is to support the next generation to thrive.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="bg-secondary/50 border-border/50 hover:border-teal/50 transition-all duration-300 overflow-hidden group">
            <div className="relative h-48 overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                style={{
                  backgroundImage: 'url(https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800)'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-background/20 to-transparent" />
              <div className="absolute bottom-4 left-4 w-12 h-12 rounded-lg bg-teal/20 backdrop-blur-sm border border-teal/30 flex items-center justify-center">
                <Radio className="h-6 w-6 text-teal" />
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-xl text-teal">Live Events</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                From intimate gatherings to large-scale productions, we provide complete sound and lighting solutions for events of any size.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-secondary/50 border-border/50 hover:border-coral/50 transition-all duration-300 overflow-hidden group">
            <div className="relative h-48 overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                style={{
                  backgroundImage: 'url(/images/recording-studio.png)'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-background/20 to-transparent" />
              <div className="absolute bottom-4 left-4 w-12 h-12 rounded-lg bg-coral/20 backdrop-blur-sm border border-coral/30 flex items-center justify-center">
                <Mic2 className="h-6 w-6 text-coral" />
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-xl text-coral">Recording Studio</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Professional recording services with experienced engineers. Capture your sound with industry-standard equipment and expertise.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-secondary/50 border-border/50 hover:border-sky/50 transition-all duration-300 overflow-hidden group">
            <div className="relative h-48 overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                style={{
                  backgroundImage: 'url(/images/studio-wide-angle.jpg)'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-background/20 to-transparent" />
              <div className="absolute bottom-4 left-4 w-12 h-12 rounded-lg bg-sky/20 backdrop-blur-sm border border-sky/30 flex items-center justify-center">
                <Music2 className="h-6 w-6 text-sky" />
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-xl text-sky">Rehearsal Space</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Clean, air-conditioned rehearsal space with professional PA system, mixer, and optional drum kit. Perfect for bands and solo artists.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Why Choose <span className="text-gold">Us?</span></h2>
            <p className="text-lg text-muted-foreground">
              We're committed to delivering exceptional service and premium equipment for every project.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 max-w-6xl mx-auto">
            <Card className="bg-gradient-to-br from-gold/10 to-gold/5 border-gold/20 text-center hover:scale-105 transition-transform duration-300">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-gold" />
                </div>
                <CardTitle className="text-base md:text-lg text-gold">Professional Equipment</CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-teal/10 to-teal/5 border-teal/20 text-center hover:scale-105 transition-transform duration-300">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-teal/20 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-teal" />
                </div>
                <CardTitle className="text-base md:text-lg text-teal">Experienced Engineers</CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-coral/10 to-coral/5 border-coral/20 text-center hover:scale-105 transition-transform duration-300">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-coral/20 flex items-center justify-center mx-auto mb-4">
                  <Music2 className="h-8 w-8 text-coral" />
                </div>
                <CardTitle className="text-base md:text-lg text-coral">Flexible Packages</CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-sky/10 to-sky/5 border-sky/20 text-center hover:scale-105 transition-transform duration-300">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-sky/20 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-sky" />
                </div>
                <CardTitle className="text-base md:text-lg text-sky">Clean Studio</CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-gold/10 to-gold/5 border-gold/20 text-center hover:scale-105 transition-transform duration-300 col-span-2 sm:col-span-1">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4">
                  <Headphones className="h-8 w-8 text-gold" />
                </div>
                <CardTitle className="text-base md:text-lg text-gold">Reliable Service</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="max-w-5xl mx-auto relative overflow-hidden rounded-2xl">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url(/images/ready-get-started.png)'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-background/40 to-background/60" />

          <div className="relative pt-8 md:pt-12 pb-12 md:pb-16 px-12 md:px-16 text-left md:text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-8 text-foreground">Ready to get started?</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/equipment">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 shadow-lg">
                  Browse Equipment
                </Button>
              </Link>
              <Link href="/cart">
                <Button size="lg" variant="outline" className="border-accent bg-background/80 hover:bg-background text-foreground px-8">
                  Book Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
