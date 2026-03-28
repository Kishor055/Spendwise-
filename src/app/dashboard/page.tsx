"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, CreditCard, Loader2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TransactionForm } from '@/components/transactions/transaction-form';
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
  const { user, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({ balance: 0, income: 0, expense: 0 });
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Listen to all transactions for summary
    const qAll = query(collection(db, 'users', user.uid, 'transactions'), orderBy('date', 'desc'));
    const unsubAll = onSnapshot(qAll, (snapshot) => {
      let inc = 0;
      let exp = 0;
      const txs = snapshot.docs.map(doc => {
        const data = doc.data() as Transaction;
        if (data.type === 'income') inc += data.amount;
        else exp += data.amount;
        return { ...data, id: doc.id };
      });
      setSummary({ balance: inc - exp, income: inc, expense: exp });
      setTransactions(txs.slice(0, 5)); // Just the recent 5
      setLoading(false);
    });

    return () => unsubAll();
  }, [user]);

  if (authLoading || (loading && !user)) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <header className="px-6 pt-10 pb-6 flex flex-col gap-1">
        <p className="text-muted-foreground font-medium">Welcome back,</p>
        <h1 className="text-3xl font-bold tracking-tight">{user?.displayName || 'Adventurer'}</h1>
      </header>

      <main className="px-6 space-y-8 max-w-4xl mx-auto">
        {/* Balance Card */}
        <Card className="bg-primary border-none text-white shadow-2xl rounded-[2rem] overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <CardHeader className="relative">
            <CardTitle className="text-white/80 text-sm font-medium uppercase tracking-wider">Total Balance</CardTitle>
            <div className="text-4xl font-bold mt-2">${summary.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </CardHeader>
          <CardContent className="relative grid grid-cols-2 gap-4 mt-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 space-y-1">
              <div className="flex items-center gap-1 text-white/70 text-xs font-medium">
                <div className="p-1 rounded-full bg-[#43A047]/20 text-[#43A047]">
                  <ArrowUpRight className="h-3 w-3" />
                </div>
                Income
              </div>
              <div className="text-lg font-bold">${summary.income.toLocaleString()}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 space-y-1">
              <div className="flex items-center gap-1 text-white/70 text-xs font-medium">
                <div className="p-1 rounded-full bg-[#E53935]/20 text-[#E53935]">
                  <ArrowDownRight className="h-3 w-3" />
                </div>
                Expenses
              </div>
              <div className="text-lg font-bold">${summary.expense.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>

        {/* Categories / Quick Actions */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Recent Transactions</h2>
            <Button variant="ghost" className="text-primary font-semibold" asChild>
              <a href="/transactions">See all</a>
            </Button>
          </div>

          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-10 glass-card rounded-3xl">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-20" />
                <p className="text-muted-foreground">No transactions yet.</p>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="mt-4">Add your first one</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add Transaction</DialogTitle>
                    </DialogHeader>
                    <TransactionForm onSuccess={() => setIsAddOpen(false)} />
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 glass-card rounded-2xl transition-all hover:translate-x-1">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center",
                      tx.type === 'income' ? "bg-[#43A047]/10 text-[#43A047]" : "bg-[#E53935]/10 text-[#E53935]"
                    )}>
                      {tx.type === 'income' ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
                    </div>
                    <div>
                      <p className="font-bold">{tx.category}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.date?.seconds ? format(new Date(tx.date.seconds * 1000), 'MMM dd, yyyy') : ''}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "font-bold text-lg",
                    tx.type === 'income' ? "text-[#43A047]" : "text-[#E53935]"
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