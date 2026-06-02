'use client';

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, serverTimestamp } from 'firebase/firestore';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ShieldAlert, 
  TrendingUp, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  PieChart, 
  Zap,
  LayoutGrid
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = ['Food', 'Shopping', 'Travel', 'Recharge', 'Electricity', 'Fuel', 'Rent', 'EMI', 'Entertainment', 'Healthcare', 'Other'];

export default function BudgetPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [limit, setLimit] = useState('');

  const budgetsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'budgets'));
  }, [firestore, user]);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'transactions'));
  }, [firestore, user]);

  const { data: budgets } = useCollection(budgetsQuery);
  const { data: transactions } = useCollection(transactionsQuery);

  const getSpent = (cat: string) => {
    if (!transactions) return 0;
    return transactions
      .filter(tx => tx.category === cat && tx.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0);
  };

  const handleAdd = () => {
    if (!user || !firestore || !limit) return;
    const colRef = collection(firestore, 'users', user.uid, 'budgets');
    addDocumentNonBlocking(colRef, {
      userId: user.uid,
      category,
      limit: parseFloat(limit),
      month: new Date().toISOString().slice(0, 7)
    });
    setLimit('');
    setIsAdding(false);
    toast({ title: "Sector Protocol Set", description: `Budget for ${category} initialized.` });
  };

  const handleDelete = (id: string) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'users', user.uid, 'budgets', id);
    deleteDocumentNonBlocking(docRef);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-44">
      <header className="px-8 py-10 bg-[#020617]/90 backdrop-blur-3xl sticky top-0 z-50 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" className="rounded-2xl glass h-14 w-14" asChild>
              <Link href="/dashboard"><ChevronLeft className="h-7 w-7" /></Link>
            </Button>
            <div>
              <h1 className="text-2xl font-black tracking-tight italic">Sector Limits</h1>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 mt-1">Resource Allocation Matrix</p>
            </div>
          </div>
          <Button size="icon" className="rounded-2xl h-14 w-14 bg-primary shadow-2xl shadow-primary/20" onClick={() => setIsAdding(!isAdding)}>
            <Plus className="h-7 w-7" />
          </Button>
        </div>
      </header>

      <main className="px-8 space-y-8 max-w-5xl mx-auto py-10">
        <section className="p-10 rounded-[3rem] glass-dark relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10">
            <LayoutGrid className="h-32 w-32 rotate-12" />
          </div>
          <div className="relative z-10">
             <h2 className="text-4xl font-black italic tracking-tighter">Strategic<br />Control.</h2>
             <div className="mt-8 flex items-center gap-3 bg-primary/10 w-fit px-6 py-2 rounded-full border border-primary/20">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest">Efficiency: Optimal</span>
             </div>
          </div>
        </section>

        {isAdding && (
          <Card className="rounded-[2.5rem] border-white/5 glass p-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-primary">Initialize Limit</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <select 
                  className="h-14 rounded-2xl bg-[#0a0a16] border border-white/10 px-6 font-bold text-sm outline-none"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 font-black">₹</span>
                  <Input type="number" placeholder="Limit" value={limit} onChange={(e) => setLimit(e.target.value)} className="h-14 rounded-2xl glass border-white/5 pl-12 font-bold" />
                </div>
              </div>
              <Button className="w-full h-14 rounded-2xl bg-primary font-black uppercase text-[10px] tracking-widest shadow-xl" onClick={handleAdd}>Execute Protocol</Button>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {!budgets || budgets.length === 0 ? (
            <div className="col-span-full py-20 text-center opacity-10 flex flex-col items-center gap-4">
              <ShieldAlert className="h-16 w-16" />
              <p className="font-black uppercase tracking-[0.4em] text-[10px]">No active sector limits</p>
            </div>
          ) : (
            budgets.map((budget) => {
              const spent = getSpent(budget.category);
              const progress = Math.min((spent / budget.limit) * 100, 100);
              const isDanger = progress > 90;

              return (
                <div key={budget.id} className="p-8 glass-dark rounded-[3rem] border border-white/5 group transition-all hover:bg-white/[0.03]">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                        <PieChart className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black">{budget.category}</h3>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Monthly Cap</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-white/10 hover:text-rose-500 rounded-xl" onClick={() => handleDelete(budget.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <span className="text-3xl font-black italic tracking-tighter">₹{spent.toLocaleString()}</span>
                        <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Consumed</p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-white/60">₹{budget.limit.toLocaleString()}</span>
                        <p className="text-[10px] font-black uppercase text-white/20 tracking-widest">Matrix Limit</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                       <Progress value={progress} className="h-2.5 bg-white/[0.03]" indicatorClassName={isDanger ? "bg-rose-500" : "bg-primary"} />
                       <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.2em]">
                          <span className={isDanger ? "text-rose-400" : "text-primary"}>{Math.round(progress)}% Utilization</span>
                          <span className="text-white/20">₹{Math.max(0, budget.limit - spent).toLocaleString()} Remaining</span>
                       </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
