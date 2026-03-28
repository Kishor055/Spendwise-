"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2, ArrowRight, Wallet, TrendingUp, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-4 h-16 flex items-center justify-between border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-primary">Spendwise</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get Started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="px-4 py-20 text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Master Your Money, <br />
            <span className="text-primary">Shape Your Future.</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            The minimal, modern expense tracker designed for people who value financial clarity and peace of mind.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="rounded-full h-14 px-8 text-lg" asChild>
              <Link href="/register">
                Start Tracking Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="rounded-full h-14 px-8 text-lg">
              View Demo
            </Button>
          </div>
        </section>

        <section className="px-4 py-20 bg-muted/30">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl glass-card text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Smart Insights</h3>
              <p className="text-muted-foreground">Visualize your spending patterns with beautiful charts and monthly breakdowns.</p>
            </div>
            <div className="p-8 rounded-3xl glass-card text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#43A047]/10 flex items-center justify-center mx-auto">
                <Wallet className="h-6 w-6 text-[#43A047]" />
              </div>
              <h3 className="text-xl font-bold">Real-time Tracking</h3>
              <p className="text-muted-foreground">Add expenses on the go and see your balance update instantly across all devices.</p>
            </div>
            <div className="p-8 rounded-3xl glass-card text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
                <ShieldCheck className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold">Secure by Design</h3>
              <p className="text-muted-foreground">Your financial data is private and secured with industry-standard encryption.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-10 border-t text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Spendwise. All rights reserved.
      </footer>
    </div>
  );
}