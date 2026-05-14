
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
  Calendar
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
    if (!transactions) return { balance: 0, income: 0, expense: 0, budget: 2000 };
    return transactions.reduce((acc, tx) => {
      if (tx.type === 'income') {
        acc.income += tx.amount;
        acc.balance += tx.amount;
      } else {
        acc.expense += tx.amount;
        acc.balance -= tx.amount;
      }
      return acc;
    }, { balance: 0, income: 0, expense: 0, budget: 2000 });
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
    <div className="min-h-screen bg-background pb-24">
      <header className="px-6 pt-12 pb-6 flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm font-medium">Monthly Summary</p>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Hi, {user?.displayName?.split(' ')[0] || 'there'} 👋
          </h1>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="rounded-full h-12 w-12 shadow-lg shadow-primary/20">
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
            <DialogHeader>
              <DialogTitle>New Transaction</DialogTitle>
            </DialogHeader>
            <TransactionForm onSuccess={() => setIsAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </header>

      <main className="px-6 space-y-6 max-w-4xl mx-auto">
        {/* Main Balance Card */}
        <Card className="bg-primary border-none text-white shadow-2xl rounded-[2.5rem] overflow-hidden relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/20 rounded-full -ml-16 -mb-16 blur-2xl"></div>
          
          <CardHeader className="relative pb-2">
            <CardTitle className="text-white/70 text-xs font-bold uppercase tracking-[0.2em]">Total Balance</CardTitle>
            <div className="text-5xl font-black mt-2 tracking-tighter">
              ${summary.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </CardHeader>
          
          <CardContent className="relative pt-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/15 backdrop-blur-xl rounded-3xl p-4 flex items-center gap-3">
                <div className="p-2 rounded-2xl bg-white/20">
                  <ArrowUpRight className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/60 uppercase">Income</p>
                  <p className="text-lg font-bold">${summary.income.toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-white/15 backdrop-blur-xl rounded-3xl p-4 flex items-center gap-3">
                <div className="p-2 rounded-2xl bg-white/20">
                  <ArrowDownRight className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/60 uppercase">Expenses</p>
                  <p className="text-lg font-bold">${summary.expense.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-3xl p-5 space-y-3">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Monthly Budget</p>
                  <p className="text-sm font-semibold">${summary.expense.toLocaleString()} of ${summary.budget.toLocaleString()}</p>
                </div>
                <span className="text-xs font-black bg-white/20 px-2 py-1 rounded-lg">
                  {Math.round(budgetProgress)}%
                </span>
              </div>
              <Progress value={budgetProgress} className="h-2 bg-white/20" indicatorClassName="bg-white" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Insights */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="rounded-[2rem] border-none shadow-sm glass-card overflow-hidden">
            <CardContent className="p-5 flex flex-col gap-2">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Top Category</p>
              <p className="text-lg font-black truncate">
                {transactions?.filter(t => t.type === 'expense')[0]?.category || 'N/A'}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-[2rem] border-none shadow-sm glass-card overflow-hidden">
            <CardContent className="p-5 flex flex-col gap-2">
              <div className="h-10 w-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                <Calendar className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Avg. Daily</p>
              <p className="text-lg font-black">${(summary.expense / 30).toFixed(0)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight">Recent Activity</h2>
            <Button variant="ghost" className="text-primary font-bold hover:bg-primary/5" asChild>
              <a href="/transactions">View All</a>
            </Button>
          </div>

          <div className="space-y-3">
            {!transactions || transactions.length === 0 ? (
              <div className="text-center py-16 glass-card rounded-[2.5rem] border-dashed border-2">
                <CreditCard className="h-14 w-14 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No transactions found.</p>
                <Button variant="outline" className="mt-4 rounded-full" onClick={() => setIsAddOpen(true)}>
                  Add Transaction
                </Button>
              </div>
            ) : (
              transactions.slice(0, 6).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 glass-card rounded-[1.5rem] transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                      tx.type === 'income' ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                    )}>
                      {tx.type === 'income' ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{tx.category}</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        {tx.date?.seconds ? format(new Date(tx.date.seconds * 1000), 'MMM dd') : 'Today'}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "font-black text-base tabular-nums",
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
