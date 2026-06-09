
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Loader2, ArrowRight, Wallet, TrendingUp, ShieldCheck, Sparkles, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';

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
      <div className="h-screen w-full flex items-center justify-center bg-[#020617]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-white selection:bg-primary/30">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/5 blur-[150px] rounded-full" />
      </div>

      <header className="px-8 h-24 flex items-center justify-between sticky top-0 z-50 bg-[#020617]/50 backdrop-blur-2xl border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/30">
            <BrainCircuit className="h-7 w-7 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter italic">SpendWise</span>
        </div>
        <Button className="rounded-2xl h-12 px-8 font-black text-[10px] uppercase tracking-widest bg-primary shadow-xl shadow-primary/20" asChild>
          <Link href="/login">Initialize Session</Link>
        </Button>
      </header>

      <main className="flex-1 relative z-10">
        <section className="px-8 py-32 text-center max-w-5xl mx-auto space-y-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 bg-primary/10 text-primary px-6 py-2.5 rounded-full border border-primary/20"
          >
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Quantum Strategic Intelligence</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] italic"
          >
            Wealth Matrix <br />
            <span className="text-primary text-glow">Mastered.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/40 max-w-2xl mx-auto font-bold leading-relaxed tracking-tight"
          >
            The world's most advanced AI financial terminal. Simple identity access. Infinite commercial insights.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-6 justify-center pt-8"
          >
            <Button size="lg" className="rounded-[2rem] h-20 px-12 text-lg font-black bg-primary shadow-3xl shadow-primary/40 group overflow-hidden relative" asChild>
              <Link href="/login">
                <span className="relative z-10">Enter the Matrix</span>
                <ArrowRight className="ml-3 h-6 w-6 relative z-10 group-hover:translate-x-2 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </Button>
          </motion.div>
        </section>

        <section className="px-8 py-32 border-t border-white/5 bg-white/[0.02]">
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-10">
            {[
              { title: 'Neural Trends', icon: TrendingUp, text: 'Real-time temporal analysis of your commercial evolution.', color: 'text-primary' },
              { title: 'Easy Access', icon: Wallet, text: 'No passwords. No friction. Just your neural identity.', color: 'text-accent' },
              { title: 'Strategic Shield', icon: ShieldCheck, text: 'Quantum-grade encryption for your private matrix logs.', color: 'text-emerald-400' }
            ].map((feature, i) => (
              <motion.div 
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-12 rounded-[3rem] glass-dark space-y-8 border border-white/5 hover:bg-white/[0.05] transition-all group"
              >
                <div className={cn("w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform", feature.color)}>
                  <feature.icon className="h-8 w-8" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-black italic tracking-tighter">{feature.title}</h3>
                  <p className="text-white/40 font-bold leading-relaxed text-base">{feature.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <footer className="py-20 border-t border-white/5 px-8 flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
            <BrainCircuit className="h-5 w-5 text-primary" />
          </div>
          <span className="text-sm font-black tracking-tighter italic uppercase">SpendWise Core</span>
        </div>
        <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.5em]">
          &copy; {new Date().getFullYear()} Nexus Financial Terminal. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
