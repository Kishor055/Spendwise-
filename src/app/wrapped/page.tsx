
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { generateMoneyWrapped } from '@/ai/flows/money-wrapped-flow';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Button } from '@/components/ui/button';
import { Sparkles, Trophy, Calendar, Zap, Rocket, ChevronLeft, Loader2, Share2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function MoneyWrappedPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [wrapped, setWrapped] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc'), limit(50));
  }, [firestore, user]);

  const { data: transactions } = useCollection(transactionsQuery);

  useEffect(() => {
    async function getWrapped() {
      if (!transactions || transactions.length === 0 || !user) {
        if (transactions?.length === 0) setIsLoading(false);
        return;
      }
      
      try {
        const response = await generateMoneyWrapped({
          userName: user.displayName || 'Friend',
          transactions: transactions.map(t => ({
            amount: t.amount,
            type: t.type,
            category: t.category,
            date: t.date?.seconds ? new Date(t.date.seconds * 1000).toDateString() : 'Today'
          }))
        });
        setWrapped(response);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    getWrapped();
  }, [transactions, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center text-primary-foreground p-6 text-center">
        <Loader2 className="h-16 w-16 animate-spin mb-6 opacity-50" />
        <h1 className="text-4xl font-black tracking-tighter mb-4">Crafting your story...</h1>
        <p className="font-bold uppercase tracking-widest text-xs opacity-70">AI is analyzing your vibes</p>
      </div>
    );
  }

  if (!wrapped) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <Rocket className="h-16 w-16 text-primary mb-6 animate-bounce" />
        <h1 className="text-3xl font-black tracking-tighter mb-4">Not enough data yet!</h1>
        <p className="text-muted-foreground font-bold mb-8 max-w-xs">Track at least 5 transactions to unlock your AI Money Wrapped.</p>
        <Button asChild rounded-full className="rounded-full h-14 px-10">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-accent text-white pb-32">
      <header className="px-6 pt-12 flex items-center justify-between">
        <Button variant="ghost" size="icon" className="rounded-2xl bg-white/10 text-white" asChild>
          <Link href="/dashboard"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Spendwise 2024</p>
          <h1 className="text-xl font-black">Wrapped</h1>
        </div>
      </header>

      <main className="px-6 py-12 space-y-8 max-w-lg mx-auto overflow-hidden">
        <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-10 duration-700">
          <div className="inline-block p-4 bg-white/10 backdrop-blur-xl rounded-[3rem] border border-white/20 shadow-2xl">
            <Trophy className="h-12 w-12 text-yellow-300 mx-auto mb-2" />
            <h2 className="text-sm font-black uppercase tracking-widest opacity-80">Your Saving Style</h2>
            <p className="text-3xl font-black tracking-tighter text-yellow-100">{wrapped.personality}</p>
          </div>
        </div>

        <section className="glass border-white/20 p-8 rounded-[3rem] space-y-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-60">The Big Picture</h3>
            <p className="text-xl font-bold leading-tight">{wrapped.summary}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-5 rounded-[2rem] border border-white/10">
              <Sparkles className="h-5 w-5 text-accent mb-2" />
              <p className="text-[10px] font-black uppercase opacity-60">Obsession</p>
              <p className="text-lg font-black">{wrapped.topCategory}</p>
            </div>
            <div className="bg-white/5 p-5 rounded-[2rem] border border-white/10">
              <Calendar className="h-5 w-5 text-orange-400 mb-2" />
              <p className="text-[10px] font-black uppercase opacity-60">Peak Spend</p>
              <p className="text-lg font-black">{wrapped.mostExpensiveDay}</p>
            </div>
          </div>
        </section>

        <div className="p-8 bg-accent/20 backdrop-blur-3xl rounded-[3rem] border border-accent/30 relative overflow-hidden animate-in fade-in slide-in-from-bottom-14 duration-1000 delay-500">
          <Zap className="h-10 w-10 text-accent mb-4" />
          <h3 className="text-lg font-black mb-2 italic">Did you know?</h3>
          <p className="text-lg font-bold opacity-90">{wrapped.funFact}</p>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl" />
        </div>

        <div className="text-center pt-8 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-700">
          <p className="text-sm font-black italic opacity-70 mb-8">"{wrapped.savingMantra}"</p>
          <Button className="w-full h-16 rounded-full bg-white text-primary text-lg font-black hover:scale-105 transition-transform shadow-2xl">
            <Share2 className="mr-2 h-6 w-6" /> Share My Wrapped
          </Button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
