"use client";

import { useMemo, useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard, 
  Loader2, 
  Plus, 
  TrendingUp, 
  Wallet,
  Sparkles,
  Trophy,
  Target,
  ChevronRight,
  Flame,
  Rocket,
  Zap,
  Activity,
  Crown
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TransactionForm } from '@/components/transactions/transaction-form';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from 'next/link';

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: any;
  note?: string;
}

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'transactions'),
      orderBy('date', 'desc'),
      limit(50)
    );
  }, [firestore, user]);

  const goalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'goals'), limit(3));
  }, [firestore, user]);

  const { data: transactions, isLoading: isTransactionsLoading } = useCollection<Transaction>(transactionsQuery);
  const { data: goals } = useCollection(goalsQuery);

  const stats = useMemo(() => {
    if (!transactions) return { balance: 0, income: 0, expense: 0, budget: 50000, healthScore: 0 };
    const totals = transactions.reduce((acc, tx) => {
      if (tx.type === 'income') {
        acc.income += tx.amount;
        acc.balance += tx.amount;
      } else {
        acc.expense += tx.amount;
        acc.balance -= tx.amount;
      }
      return acc;
    }, { balance: 0, income: 0, expense: 0, budget: 50000 });

    const savingsRate = totals.income > 0 ? (totals.income - totals.expense) / totals.income : 0;
    const healthScore = Math.max(0, Math.min(100, Math.round(savingsRate * 100 + 50)));

    return { ...totals, healthScore };
  }, [transactions]);

  const budgetProgress = Math.min((stats.expense / stats.budget) * 100, 100);

  if (isUserLoading || (isTransactionsLoading && !transactions)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#020617]">
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-44 text-white bg-[#020617]">
      <header className="px-6 pt-10 pb-6 flex justify-between items-center sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-2xl border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent p-[1px]">
            <div className="w-full h-full bg-[#020617] rounded-xl flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none text-white">
              {user?.displayName?.split(' ')[0] || 'Explorer'}
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Premium Status</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2.5">
          <Button variant="ghost" size="icon" className="rounded-xl glass h-10 w-10" asChild>
            <Link href="/ai-assistant">
              <Sparkles className="h-5 w-5 text-accent" />
            </Link>
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="rounded-xl h-10 w-10 bg-primary shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                <Plus className="h-6 w-6 text-white" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass-dark rounded-[2rem] border-white/10">
              <DialogHeader>
                <DialogTitle className="text-xl font-black italic">Log Entry</DialogTitle>
              </DialogHeader>
              <TransactionForm onSuccess={() => setIsAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="px-6 space-y-8 max-w-4xl mx-auto pt-6">
        {/* Hero Wealth Card */}
        <section className="relative">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
          
          <Card className="glass-dark border-white/10 overflow-hidden rounded-[2.5rem] relative z-10 shadow-2xl">
            <CardHeader className="pb-2 pt-8 px-8 flex-row items-start justify-between">
              <div>
                <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-1">Total Liquidity</p>
                <div className="text-4xl md:text-5xl font-black tracking-tighter tabular-nums text-white">
                  ₹{stats.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full glass border-white/10 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest",
                stats.healthScore > 70 ? "text-green-400" : "text-orange-400"
              )}>
                <Activity className="h-3 w-3" />
                Score: {stats.healthScore}
              </div>
            </CardHeader>
            
            <CardContent className="pt-6 pb-8 px-8 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="glass rounded-2xl p-5 border-white/5 bg-white/[0.02]">
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <ArrowUpRight className="h-2.5 w-2.5 text-green-400" /> Inflow
                  </p>
                  <p className="text-lg font-black text-white">₹{stats.income.toLocaleString('en-IN')}</p>
                </div>
                <div className="glass rounded-2xl p-5 border-white/5 bg-white/[0.02]">
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <ArrowDownRight className="h-2.5 w-2.5 text-red-400" /> Outflow
                  </p>
                  <p className="text-lg font-black text-white">₹{stats.expense.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Monthly Cap</p>
                  <p className="text-[10px] font-bold text-white/80">
                    ₹{stats.expense.toLocaleString('en-IN')} / <span className="text-white/40">₹{stats.budget.toLocaleString('en-IN')}</span>
                  </p>
                </div>
                <Progress 
                  value={budgetProgress} 
                  className="h-2 bg-white/[0.05]" 
                  indicatorClassName={cn(
                    budgetProgress > 85 ? "bg-destructive shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "bg-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                  )} 
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/ai-assistant" className="col-span-2">
            <div className="glass rounded-[2rem] p-6 flex items-center gap-5 border-white/10 hover:bg-white/[0.05] transition-all group">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-black text-accent uppercase tracking-widest">Neural Advisor</p>
                <p className="text-sm font-bold text-white/90">Optimize my spending patterns</p>
              </div>
              <ChevronRight className="h-4 w-4 text-white/20 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
          
          <Link href="/wrapped">
            <div className="glass rounded-[2rem] p-5 flex flex-col gap-3 border-white/10 hover:bg-white/[0.05] transition-all group">
              <div className="h-10 w-10 rounded-xl bg-orange-400/10 flex items-center justify-center text-orange-400">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Wrapped</p>
                <p className="text-xs font-bold text-white/80 mt-0.5">Annual Pulse</p>
              </div>
            </div>
          </Link>

          <Link href="/analytics">
            <div className="glass rounded-[2rem] p-5 flex flex-col gap-3 border-white/10 hover:bg-white/[0.05] transition-all group">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[9px] font-black text-primary uppercase tracking-widest">Insights</p>
                <p className="text-xs font-bold text-white/80 mt-0.5">Visual Trends</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Dynamic Activity Feed */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/40">Recent Activity</h2>
            <Link href="/transactions" className="text-[9px] font-black text-primary uppercase tracking-widest hover:text-white transition-colors">View All</Link>
          </div>

          <div className="space-y-3">
            {!transactions || transactions.length === 0 ? (
              <div className="py-12 glass rounded-[2rem] flex flex-col items-center opacity-30 border-dashed border-white/10">
                <Activity className="h-10 w-10 mb-2" />
                <p className="text-[9px] font-black uppercase tracking-widest">No signals detected</p>
              </div>
            ) : (
              transactions.slice(0, 4).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-5 glass rounded-[2rem] border-white/5 hover:bg-white/[0.04] transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105",
                      tx.type === 'income' ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
                    )}>
                      {tx.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white/90">{tx.category}</p>
                      <p className="text-[9px] text-white/40 font-black uppercase tracking-widest mt-0.5">
                        {tx.date?.seconds ? format(new Date(tx.date.seconds * 1000), 'MMM dd') : 'Current'}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "font-black text-sm tabular-nums",
                    tx.type === 'income' ? "text-green-400" : "text-white"
                  )}>
                    {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}