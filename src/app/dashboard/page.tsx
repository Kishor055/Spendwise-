
"use client";

import { useMemo, useState, useEffect } from 'react';
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
  Calendar,
  Sparkles,
  Trophy,
  Target
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
      limit(20)
    );
  }, [firestore, user]);

  const { data: transactions, isLoading: isTransactionsLoading } = useCollection<Transaction>(transactionsQuery);

  const summary = useMemo(() => {
    if (!transactions) return { balance: 0, income: 0, expense: 0, budget: 2500 };
    return transactions.reduce((acc, tx) => {
      if (tx.type === 'income') {
        acc.income += tx.amount;
        acc.balance += tx.amount;
      } else {
        acc.expense += tx.amount;
        acc.balance -= tx.amount;
      }
      return acc;
    }, { balance: 0, income: 0, expense: 0, budget: 2500 });
  }, [transactions]);

  const budgetProgress = Math.min((summary.expense / summary.budget) * 100, 100);

  if (isUserLoading || (isTransactionsLoading && !transactions)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="px-6 pt-12 pb-6 flex justify-between items-center sticky top-0 bg-background/80 backdrop-blur-md z-40">
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">Spendwise Pro</p>
          <h1 className="text-2xl font-black tracking-tight">
            Hi, {user?.displayName?.split(' ')[0] || 'there'} 👋
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="rounded-full bg-primary/10 text-primary" asChild>
            <Link href="/ai-assistant"><Sparkles className="h-5 w-5" /></Link>
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="rounded-full h-10 w-10 shadow-xl shadow-primary/20">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2.5rem]">
              <DialogHeader>
                <DialogTitle>New Transaction</DialogTitle>
              </DialogHeader>
              <TransactionForm onSuccess={() => setIsAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="px-6 space-y-8 max-w-4xl mx-auto">
        {/* Main Balance Card */}
        <Card className="bg-primary border-none text-white shadow-2xl rounded-[3rem] overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl transition-transform group-hover:scale-110 duration-700"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full -ml-24 -mb-24 blur-3xl"></div>
          
          <CardHeader className="relative pb-2">
            <CardTitle className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em]">Total Wealth</CardTitle>
            <div className="text-5xl font-black mt-2 tracking-tighter tabular-nums">
              ${summary.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </CardHeader>
          
          <CardContent className="relative pt-4 space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-4 flex items-center gap-3 border border-white/10">
                <div className="p-2.5 rounded-2xl bg-white/20">
                  <ArrowUpRight className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/50 uppercase">Income</p>
                  <p className="text-base font-black tabular-nums">${summary.income.toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-4 flex items-center gap-3 border border-white/10">
                <div className="p-2.5 rounded-2xl bg-white/20">
                  <ArrowDownRight className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/50 uppercase">Spent</p>
                  <p className="text-base font-black tabular-nums">${summary.expense.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-black/20 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Monthly Limit</p>
                  <p className="text-sm font-black text-white/90">${summary.expense.toLocaleString()} of ${summary.budget.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black bg-white/20 px-3 py-1 rounded-full uppercase">
                    {Math.round(budgetProgress)}% Used
                  </span>
                </div>
              </div>
              <Progress value={budgetProgress} className="h-3 bg-white/10" indicatorClassName={cn(
                "transition-all duration-1000",
                budgetProgress > 90 ? "bg-destructive" : budgetProgress > 70 ? "bg-orange-400" : "bg-white"
              )} />
            </div>
          </CardContent>
        </Card>

        {/* AI Insight Strip */}
        <Link href="/ai-assistant">
          <div className="p-5 glass-card rounded-[2rem] border-none shadow-sm flex items-center gap-4 group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest">AI Financial Insight</p>
              <p className="text-sm font-bold text-muted-foreground line-clamp-1">
                {summary.expense > summary.budget * 0.8 
                  ? "You've used 80% of your budget. Consider cutting down on entertainment." 
                  : "Great job! You're well within your spending limit this month."}
              </p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-muted-foreground/30" />
          </div>
        </Link>

        {/* Goals & Progress */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Target className="h-5 w-5 text-accent" />
              Active Goals
            </h2>
            <Button variant="ghost" size="sm" className="font-bold text-accent">Manage</Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card className="rounded-[2rem] border-none shadow-sm glass-card overflow-hidden">
              <CardContent className="p-5 flex flex-col gap-3">
                <div className="h-10 w-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase">Vacation Fund</p>
                  <p className="text-lg font-black">$1,200 / $3,000</p>
                </div>
                <Progress value={40} className="h-1.5" indicatorClassName="bg-accent" />
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] border-none shadow-sm glass-card overflow-hidden">
              <CardContent className="p-5 flex flex-col gap-3">
                <div className="h-10 w-10 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase">Emergency</p>
                  <p className="text-lg font-black">$5,000 / $5,000</p>
                </div>
                <div className="text-[10px] font-black text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full w-fit">COMPLETED</div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight">Recent Activity</h2>
            <Button variant="ghost" className="text-primary font-black hover:bg-primary/5 px-0" asChild>
              <Link href="/transactions">View Full History</Link>
            </Button>
          </div>

          <div className="space-y-4">
            {!transactions || transactions.length === 0 ? (
              <div className="text-center py-20 glass-card rounded-[3rem] border-dashed border-2 flex flex-col items-center">
                <CreditCard className="h-16 w-16 text-muted-foreground/20 mb-4" />
                <p className="text-muted-foreground font-bold">No transactions yet.</p>
                <Button variant="outline" className="mt-6 rounded-full font-bold px-8" onClick={() => setIsAddOpen(true)}>
                  Start Tracking
                </Button>
              </div>
            ) : (
              transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-5 glass-card rounded-[2rem] transition-all hover:scale-[1.03] active:scale-[0.98] border-none shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner",
                      tx.type === 'income' ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                    )}>
                      {tx.type === 'income' ? <ArrowUpRight className="h-7 w-7" /> : <ArrowDownRight className="h-7 w-7" />}
                    </div>
                    <div>
                      <p className="font-black text-base">{tx.category}</p>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">
                        {tx.date?.seconds ? format(new Date(tx.date.seconds * 1000), 'MMM dd, h:mm a') : 'Just now'}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "font-black text-lg tabular-nums tracking-tighter",
                    tx.type === 'income' ? "text-green-600" : "text-red-600"
                  )}>
                    {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
