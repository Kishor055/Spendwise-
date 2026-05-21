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
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-40 text-white selection:bg-primary/30">
      <header className="px-6 pt-12 pb-6 flex justify-between items-center sticky top-0 z-50 bg-[#020617]/40 backdrop-blur-3xl border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative w-12 h-12 rounded-2xl glass flex items-center justify-center shadow-2xl">
               <Crown className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tight leading-none text-glow">
              Welcome, {user?.displayName?.split(' ')[0] || 'Explorer'}
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">SpendWise Elite Status</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" size="icon" className="rounded-2xl glass h-12 w-12 hover:bg-white/10" asChild>
            <Link href="/ai-assistant">
              <Sparkles className="h-6 w-6 text-accent animate-pulse" />
            </Link>
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="rounded-2xl h-12 w-12 bg-primary shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:scale-110 transition-all duration-300">
                <Plus className="h-6 w-6 text-white" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass-dark rounded-[3rem] border-white/10">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-glow">New Entry</DialogTitle>
              </DialogHeader>
              <TransactionForm onSuccess={() => setIsAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="px-6 space-y-10 max-w-4xl mx-auto pt-8">
        {/* Main Wealth Card */}
        <section className="relative">
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-accent/10 rounded-full blur-[100px]" />
          
          <Card className="glass-dark border-white/10 overflow-hidden rounded-[3.5rem] relative z-10 shadow-2xl transition-all duration-700 hover:border-white/20">
            <div className="absolute top-0 right-0 p-8">
               <Activity className="h-24 w-24 text-white/[0.03] absolute -top-4 -right-4" />
            </div>
            
            <CardHeader className="pb-4 pt-10 px-10">
              <div className="flex justify-between items-center mb-4">
                <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Current Liquidity</CardTitle>
                <div className={cn(
                  "px-4 py-1.5 rounded-full glass border-white/10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
                  stats.healthScore > 70 ? "text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]" : "text-orange-400"
                )}>
                  <Zap className="h-3.5 w-3.5 fill-current" />
                  Health Score: {stats.healthScore}
                </div>
              </div>
              <div className="text-6xl font-black tracking-tighter tabular-nums text-white bg-clip-text">
                ₹{stats.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </CardHeader>
            
            <CardContent className="pt-6 pb-10 px-10 space-y-10">
              <div className="grid grid-cols-2 gap-6">
                <div className="glass rounded-[2.5rem] p-6 flex flex-col gap-3 border-white/10 hover:bg-white/[0.08] transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400 shadow-inner">
                    <ArrowUpRight className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Inflow</p>
                    <p className="text-xl font-black text-green-400">₹{stats.income.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <div className="glass rounded-[2.5rem] p-6 flex flex-col gap-3 border-white/10 hover:bg-white/[0.08] transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 shadow-inner">
                    <ArrowDownRight className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Outflow</p>
                    <p className="text-xl font-black text-red-400">₹{stats.expense.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>

              <div className="glass rounded-[2.5rem] p-8 space-y-5 border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-end relative z-10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Spending Capacity</p>
                    <p className="text-lg font-black text-white/90 italic">
                      ₹{stats.expense.toLocaleString('en-IN')} <span className="text-muted-foreground font-medium text-xs">/ ₹{stats.budget.toLocaleString('en-IN')}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black px-4 py-1 rounded-full bg-white/10 text-glow">
                      {Math.round(budgetProgress)}%
                    </span>
                  </div>
                </div>
                <Progress 
                  value={budgetProgress} 
                  className="h-3 bg-black/40 rounded-full" 
                  indicatorClassName={cn(
                    "rounded-full",
                    budgetProgress > 85 ? "bg-red-500" : budgetProgress > 65 ? "bg-orange-500" : "bg-primary"
                  )} 
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-6">
          <Link href="/ai-assistant" className="col-span-2">
            <div className="glass-card rounded-[2.5rem] p-6 flex items-center gap-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-700">
                <Sparkles className="h-20 w-20 text-accent" />
              </div>
              <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent group-hover:rotate-12 transition-transform shadow-lg">
                <Sparkles className="h-7 w-7" />
              </div>
              <div className="flex-1 relative z-10">
                <p className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">Neural Advisor</p>
                <p className="text-sm font-bold text-white/70 line-clamp-1 mt-0.5">
                  Analyze my patterns for efficiency...
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
          
          <Link href="/wrapped">
            <div className="glass-card rounded-[2.5rem] p-6 flex flex-col gap-4 group">
              <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform shadow-inner">
                <Flame className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em]">Wrapped</p>
                <p className="text-xs font-bold text-muted-foreground mt-1 italic">Annual Report</p>
              </div>
            </div>
          </Link>

          <Link href="/analytics">
            <div className="glass-card rounded-[2.5rem] p-6 flex flex-col gap-4 group">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Insights</p>
                <p className="text-xs font-bold text-muted-foreground mt-1 italic">Visual Trends</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Goals Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight flex items-center gap-3 text-glow">
              <Target className="h-6 w-6 text-primary" />
              Strategic Goals
            </h2>
            <Button variant="ghost" size="sm" className="font-bold text-primary hover:bg-white/5 rounded-full" asChild>
              <Link href="/goals" className="flex items-center gap-1 uppercase text-[10px] tracking-widest">
                Manifest All <ChevronRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide px-1">
            {!goals || goals.length === 0 ? (
              <Link href="/goals" className="w-full">
                <div className="glass p-10 rounded-[3rem] border-dashed border-white/10 flex flex-col items-center justify-center text-muted-foreground hover:bg-white/5 transition-all">
                  <Rocket className="h-10 w-10 mb-3 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">Initialize Target</p>
                </div>
              </Link>
            ) : (
              goals.map((goal: any) => (
                <div key={goal.id} className="min-w-[280px] glass-card p-8 rounded-[3rem] flex flex-col gap-5 relative overflow-hidden">
                  <div className="absolute -bottom-4 -right-4 opacity-5 rotate-12">
                    <Trophy className="h-24 w-24" />
                  </div>
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-accent border border-white/10">
                      <Trophy className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-black text-accent bg-accent/10 px-3 py-1 rounded-full uppercase tracking-widest">
                      {Math.round((goal.currentAmount / goal.targetAmount) * 100)}%
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{goal.title}</p>
                    <p className="text-xl font-black mt-1 italic">₹{goal.currentAmount.toLocaleString('en-IN')}</p>
                  </div>
                  <Progress value={(goal.currentAmount/goal.targetAmount)*100} className="h-2 bg-black/30" indicatorClassName="bg-accent shadow-[0_0_10px_rgba(var(--accent),0.3)]" />
                </div>
              ))
            )}
          </div>
        </section>

        {/* Activity Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight text-glow">Live Feed</h2>
            <Link href="/transactions" className="text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:text-glow transition-all">Universal History</Link>
          </div>

          <div className="space-y-4">
            {!transactions || transactions.length === 0 ? (
              <div className="text-center py-20 glass rounded-[3rem] flex flex-col items-center opacity-30">
                <CreditCard className="h-16 w-16 mb-4" />
                <p className="font-black uppercase tracking-widest text-xs italic">No activity detected</p>
              </div>
            ) : (
              transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-6 glass rounded-[3rem] hover:bg-white/[0.08] transition-all group">
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6",
                      tx.type === 'income' ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                    )}>
                      {tx.type === 'income' ? <ArrowUpRight className="h-7 w-7" /> : <ArrowDownRight className="h-7 w-7" />}
                    </div>
                    <div>
                      <p className="font-black text-base text-white/90 tracking-tight">{tx.category}</p>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-0.5">
                        {tx.date?.seconds ? format(new Date(tx.date.seconds * 1000), 'MMM dd') : 'Current'}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "font-black text-lg tabular-nums italic",
                    tx.type === 'income' ? "text-green-400" : "text-red-400"
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