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
  ShieldCheck
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
    if (!transactions) return { balance: 0, income: 0, expense: 0, budget: 2500, healthScore: 0 };
    const totals = transactions.reduce((acc, tx) => {
      if (tx.type === 'income') {
        acc.income += tx.amount;
        acc.balance += tx.amount;
      } else {
        acc.expense += tx.amount;
        acc.balance -= tx.amount;
      }
      return acc;
    }, { balance: 0, income: 0, expense: 0, budget: 2500 });

    const savingsRate = totals.income > 0 ? (totals.income - totals.expense) / totals.income : 0;
    const healthScore = Math.max(0, Math.min(100, Math.round(savingsRate * 100 + 50)));

    return { ...totals, healthScore };
  }, [transactions]);

  const budgetProgress = Math.min((stats.expense / stats.budget) * 100, 100);

  if (isUserLoading || (isTransactionsLoading && !transactions)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <header className="px-6 pt-12 pb-6 flex justify-between items-center sticky top-0 z-50 bg-background/50 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl glass flex items-center justify-center shadow-lg">
             <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-accent" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tight leading-none">
              Hey {user?.displayName?.split(' ')[0] || 'User'}
            </h1>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">SpendWise Elite</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="rounded-2xl glass h-10 w-10" asChild>
            <Link href="/ai-assistant"><Sparkles className="h-5 w-5 text-primary" /></Link>
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="rounded-2xl h-10 w-10 bg-primary shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass-dark rounded-[2.5rem] border-none">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">New Transaction</DialogTitle>
              </DialogHeader>
              <TransactionForm onSuccess={() => setIsAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="px-6 space-y-8 max-w-4xl mx-auto">
        <section className="relative">
          <Card className="glass-dark border-none overflow-hidden rounded-[3rem] relative z-10 shadow-2xl">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Total Wealth</CardTitle>
                <div className={cn(
                  "px-3 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest",
                  stats.healthScore > 70 ? "bg-green-500/10 text-green-600" : "bg-orange-500/10 text-orange-600"
                )}>
                  <Activity className="h-3 w-3" />
                  Health: {stats.healthScore}
                </div>
              </div>
              <div className="text-5xl font-black mt-2 tracking-tighter tabular-nums text-foreground">
                ${stats.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </CardHeader>
            
            <CardContent className="pt-4 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="glass rounded-[2rem] p-5 flex flex-col gap-2 border-none">
                  <div className="w-10 h-10 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600">
                    <ArrowUpRight className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase">Income</p>
                    <p className="text-lg font-black text-green-600">${stats.income.toLocaleString()}</p>
                  </div>
                </div>
                <div className="glass rounded-[2rem] p-5 flex flex-col gap-2 border-none">
                  <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-600">
                    <ArrowDownRight className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase">Expense</p>
                    <p className="text-lg font-black text-red-600">${stats.expense.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-[2.5rem] p-6 space-y-4 border border-white/20">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Monthly Limit</p>
                    <p className="text-sm font-black">${stats.expense.toLocaleString()} / ${stats.budget.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black bg-white shadow-sm px-3 py-1 rounded-full text-primary">
                      {Math.round(budgetProgress)}%
                    </span>
                  </div>
                </div>
                <Progress 
                  value={budgetProgress} 
                  className="h-2.5 bg-background" 
                  indicatorClassName={cn(
                    budgetProgress > 85 ? "bg-destructive" : budgetProgress > 65 ? "bg-orange-400" : "bg-primary"
                  )} 
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/ai-assistant" className="col-span-2">
            <div className="glass rounded-[2rem] p-5 border-none flex items-center gap-4 group cursor-pointer hover:shadow-xl transition-all">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">AI Advisor</p>
                <p className="text-sm font-bold text-muted-foreground line-clamp-1">
                  How can I optimize my savings this week?
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground/30" />
            </div>
          </Link>
          
          <Link href="/wrapped">
            <div className="glass rounded-[2rem] p-5 border-none flex flex-col gap-3 group cursor-pointer hover:shadow-xl transition-all">
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Money Wrapped</p>
                <p className="text-xs font-bold text-muted-foreground">Yearly AI Analysis</p>
              </div>
            </div>
          </Link>

          <Link href="/analytics">
            <div className="glass rounded-[2rem] p-5 border-none flex flex-col gap-3 group cursor-pointer hover:shadow-xl transition-all">
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-accent uppercase tracking-widest">Insights</p>
                <p className="text-xs font-bold text-muted-foreground">Deep Dive Stats</p>
              </div>
            </div>
          </Link>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Active Goals
            </h2>
            <Button variant="ghost" size="sm" className="font-bold text-primary rounded-full" asChild>
              <Link href="/goals">All <ChevronRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {!goals || goals.length === 0 ? (
              <Link href="/goals" className="w-full">
                <div className="glass p-8 rounded-[2rem] border-dashed border-2 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/30 transition-colors">
                  <Rocket className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-xs font-black uppercase tracking-widest">Start a new goal</p>
                </div>
              </Link>
            ) : (
              goals.map((goal: any) => (
                <div key={goal.id} className="min-w-[220px] glass p-6 rounded-[2.5rem] flex flex-col gap-4 border-none shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase">
                      {Math.round((goal.currentAmount / goal.targetAmount) * 100)}%
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase">{goal.title}</p>
                    <p className="text-base font-black">${goal.currentAmount.toLocaleString()}</p>
                  </div>
                  <Progress value={(goal.currentAmount/goal.targetAmount)*100} className="h-1.5 bg-background" indicatorClassName="bg-accent" />
                </div>
              ))
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black tracking-tight">Recent Activity</h2>
            <Link href="/transactions" className="text-xs font-black text-primary uppercase tracking-widest">History</Link>
          </div>

          <div className="space-y-3">
            {!transactions || transactions.length === 0 ? (
              <div className="text-center py-16 glass rounded-[3rem] flex flex-col items-center opacity-40">
                <CreditCard className="h-12 w-12 mb-4" />
                <p className="font-bold text-sm">No activity found</p>
              </div>
            ) : (
              transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-5 glass rounded-[2.5rem] border-none shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center",
                      tx.type === 'income' ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                    )}>
                      {tx.type === 'income' ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
                    </div>
                    <div>
                      <p className="font-black text-sm">{tx.category}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                        {tx.date?.seconds ? format(new Date(tx.date.seconds * 1000), 'MMM dd') : 'Today'}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "font-black text-base tabular-nums",
                    tx.type === 'income' ? "text-green-600" : "text-red-600"
                  )}>
                    {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
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