
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Loader2, ArrowRight, Wallet, TrendingUp, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  const { user, isUserLoading: loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-primary/20">
      <header className="px-6 h-20 flex items-center justify-between border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-primary">Spendwise</span>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" className="font-bold rounded-full" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button className="font-bold rounded-full px-6 shadow-lg shadow-primary/20" asChild>
            <Link href="/register">Join Now</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="px-6 py-24 text-center max-w-5xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
            <Sparkles className="h-3 w-3" />
            AI-Powered Insights
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-6">
            Financial Freedom <br />
            <span className="text-primary">Simplified.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
            The intelligent, minimal expense tracker designed for modern life. Take control of every cent with beautiful automation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" className="rounded-[1.5rem] h-16 px-10 text-lg font-black shadow-2xl shadow-primary/30" asChild>
              <Link href="/register">
                Get Started Free <ArrowRight className="ml-2 h-6 w-6" />
              </Link>
            </Button>
            <Button variant="secondary" size="lg" className="rounded-[1.5rem] h-16 px-10 text-lg font-bold">
              Watch Demo
            </Button>
          </div>
        </section>

        <section className="px-6 py-24 bg-muted/30">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="p-10 rounded-[3rem] glass-card text-left space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-2xl font-black tracking-tight">Smart Trends</h3>
              <p className="text-muted-foreground font-medium">Visualize your spending patterns with beautiful, reactive charts and weekly breakdowns.</p>
            </div>
            <div className="p-10 rounded-[3rem] glass-card text-left space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center">
                <Wallet className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-2xl font-black tracking-tight">Zero-Effort</h3>
              <p className="text-muted-foreground font-medium">Add expenses in seconds. Sync across all your devices instantly with robust cloud storage.</p>
            </div>
            <div className="p-10 rounded-[3rem] glass-card text-left space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
                <ShieldCheck className="h-7 w-7 text-accent" />
              </div>
              <h3 className="text-2xl font-black tracking-tight">Encrypted</h3>
              <p className="text-muted-foreground font-medium">Your data is your business. We use military-grade security to keep your finances private.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t px-6 flex flex-col md:flex-row items-center justify-between gap-6 bg-white/50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-black tracking-tighter">Spendwise</span>
        </div>
        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
          &copy; {new Date().getFullYear()} Spendwise Inc. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
