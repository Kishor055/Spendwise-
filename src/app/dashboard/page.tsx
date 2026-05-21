"use client";

import { useMemo, useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Loader2, 
  Plus, 
  TrendingUp, 
  Sparkles,
  ChevronRight,
  Flame,
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

  const { data: transactions, isLoading: isTransactionsLoading } = useCollection<Transaction>(transactionsQuery);

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
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-44 text-white bg-[#020617]">
      <header className="px-6 py-8 flex justify-between items-center bg-[#020617]/80 backdrop-blur-2xl sticky top-0 z-50">
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
              <span className="w-1 h-1 rounded-full bg-accent animate-pulse" />
              <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Premium Status</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="rounded-xl bg-white/[0.03] h-10 w-10 hover:bg-white/[0.08]" asChild>
            <Link href="/ai-assistant">
              <Sparkles className="h-5 w-5 text-accent" />
            </Link>
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="rounded-xl h-10 w-10 bg-primary hover:scale-105 transition-all">
                <Plus className="h-6 w-6 text-white" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[#020617]/95 backdrop-blur-3xl rounded-[2.5rem] border-white/5">
              <DialogHeader>
                <DialogTitle className="text-xl font-black italic">Log Entry</DialogTitle>
              </DialogHeader>
              <TransactionForm onSuccess={() => setIsAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="px-6 space-y-6 max-w-4xl mx-auto pt-4">
        {/* Hero Card */}
        <section>
          <Card className="bg-[#0a0a16] border-white/[0.03] rounded-[2rem] overflow-hidden shadow-2xl">
            <CardHeader className="pb-2 pt-8 px-8">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">Portfolio Balance</p>
                  <div className="text-4xl font-black tracking-tighter text-white">
                    ₹{stats.balance.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-white/[0.05] flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-accent">
                  <Activity className="h-3 w-3" />
                  Health: {stats.healthScore}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 pb-8 px-8 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.02]">
                  <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <ArrowUpRight className="h-3 w-3 text-accent" /> Inflow
                  </p>
                  <p className="text-lg font-black text-white">₹{stats.income.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.02]">
                  <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <ArrowDownRight className="h-3 w-3 text-primary" /> Outflow
                  </p>
                  <p className="text-lg font-black text-white">₹{stats.expense.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Monthly Cap</p>
                  <p className="text-[10px] font-bold text-white/60">
                    ₹{stats.expense.toLocaleString('en-IN')} / <span className="text-white/20">₹{stats.budget.toLocaleString('en-IN')}</span>
                  </p>
                </div>
                <Progress 
                  value={budgetProgress} 
                  className="h-1.5 bg-white/[0.03]" 
                  indicatorClassName={cn(budgetProgress > 90 ? "bg-red-500" : "bg-primary")} 
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Neural Advisor Action */}
        <Link href="/ai-assistant">
          <div className="bg-[#0a0a16] rounded-[2rem] p-6 flex items-center gap-5 border border-white/[0.03] hover:bg-white/[0.05] transition-all group">
            <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-[8px] font-black text-accent uppercase tracking-[0.2em] mb-1">Neural Advisor</p>
              <p className="text-sm font-bold text-white/90">Optimize my spending patterns</p>
            </div>
            <ChevronRight className="h-4 w-4 text-white/10 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
        
        <div className="grid grid-cols-2 gap-4">
          <Link href="/wrapped">
            <div className="bg-[#0a0a16] rounded-[2rem] p-5 flex flex-col gap-3 border border-white/[0.03] hover:bg-white/[0.05] transition-all group">
              <div className="h-10 w-10 rounded-xl bg-orange-400/10 flex items-center justify-center text-orange-400">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[8px] font-black text-orange-400 uppercase tracking-widest">Wrapped</p>
                <p className="text-xs font-bold text-white/80 mt-0.5">Annual Pulse</p>
              </div>
            </div>
          </Link>

          <Link href="/analytics">
            <div className="bg-[#0a0a16] rounded-[2rem] p-5 flex flex-col gap-3 border border-white/[0.03] hover:bg-white/[0.05] transition-all group">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[8px] font-black text-primary uppercase tracking-widest">Insights</p>
                <p className="text-xs font-bold text-white/80 mt-0.5">Visual Trends</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Feed */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Universal History</h2>
            <Link href="/transactions" className="text-[8px] font-black text-primary uppercase tracking-widest">View All</Link>
          </div>

          <div className="space-y-3">
            {!transactions || transactions.length === 0 ? (
              <div className="py-12 bg-white/[0.02] rounded-[2rem] flex flex-col items-center opacity-10 border border-dashed border-white/10">
                <Activity className="h-8 w-8 mb-2" />
                <p className="text-[8px] font-black uppercase tracking-widest">No Signals</p>
              </div>
            ) : (
              transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-5 bg-[#0a0a16] rounded-[2rem] border border-white/[0.02] hover:bg-white/[0.04] transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      tx.type === 'income' ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                    )}>
                      {tx.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white/90">{tx.category}</p>
                      <p className="text-[8px] text-white/20 font-black uppercase tracking-widest mt-0.5">
                        {tx.date?.seconds ? format(new Date(tx.date.seconds * 1000), 'MMM dd') : 'Live'}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "font-black text-sm",
                    tx.type === 'income' ? "text-accent" : "text-white"
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