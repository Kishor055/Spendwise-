'use client';

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, serverTimestamp } from 'firebase/firestore';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  CheckCircle2,
  CalendarDays,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function SubscriptionsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');

  const subsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'subscriptions'), orderBy('amount', 'desc'));
  }, [firestore, user]);

  const { data: subscriptions } = useCollection(subsQuery);

  const handleAdd = () => {
    if (!user || !firestore || !name || !amount) return;
    const colRef = collection(firestore, 'users', user.uid, 'subscriptions');
    addDocumentNonBlocking(colRef, {
      userId: user.uid,
      name,
      amount: parseFloat(amount),
      billingCycle: cycle,
      active: true,
      nextBillingDate: new Date().toISOString(),
      createdAt: serverTimestamp()
    });
    setName('');
    setAmount('');
    setIsAdding(false);
    toast({ title: "Service Linked", description: `${name} tracking initialized.` });
  };

  const handleDelete = (id: string) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'users', user.uid, 'subscriptions', id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Purged", description: "Payment record removed." });
  };

  const monthlyBurn = (subscriptions || []).reduce((acc, sub) => {
    return acc + (sub.billingCycle === 'monthly' ? sub.amount : sub.amount / 12);
  }, 0);

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-44">
      <header className="px-6 py-10 bg-[#020617]/90 backdrop-blur-3xl sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-xl bg-white/[0.03] h-10 w-10" asChild>
              <Link href="/dashboard"><ChevronLeft className="h-5 w-5" /></Link>
            </Button>
            <h1 className="text-xl font-black tracking-tight">Recursive Bills</h1>
          </div>
          <Button 
            size="icon" 
            className="rounded-xl h-10 w-10 bg-primary"
            onClick={() => setIsAdding(!isAdding)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="px-6 space-y-6 max-w-4xl mx-auto pt-4">
        <section className="bg-[#0a0a16] border border-white/[0.03] p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-2">Monthly Commitment</p>
            <p className="text-5xl font-black tracking-tighter">₹{monthlyBurn.toLocaleString('en-IN')}</p>
            <div className="mt-8 flex items-center gap-2 bg-white/5 w-fit px-5 py-2 rounded-full border border-white/5">
              <Clock className="h-4 w-4 text-accent" />
              <span className="text-[8px] font-black uppercase tracking-widest">{subscriptions?.length || 0} active signals</span>
            </div>
          </div>
          <CreditCard className="absolute -bottom-10 -right-10 h-64 w-64 text-white/[0.02] -rotate-12" />
        </section>

        {isAdding && (
          <div className="bg-[#0a0a16] p-8 rounded-[2.5rem] border border-white/[0.05] space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-accent">Link Service</h3>
            <div className="grid gap-4">
              <Input placeholder="Service Name" value={name} onChange={(e) => setName(e.target.value)} className="h-14 rounded-2xl bg-white/[0.02] border-white/5 px-6" />
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-white/20">₹</span>
                  <Input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-14 rounded-2xl bg-white/[0.02] border-white/5 pl-10 px-6" />
                </div>
                <select 
                  className="h-14 rounded-2xl bg-[#0a0a16] border border-white/5 px-6 font-black text-[9px] uppercase tracking-widest outline-none text-white/60"
                  value={cycle}
                  onChange={(e) => setCycle(e.target.value as any)}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <Button className="w-full h-14 rounded-2xl font-black shadow-xl" onClick={handleAdd}>Enable Tracking</Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {!subscriptions || subscriptions.length === 0 ? (
            <div className="text-center py-20 opacity-10 flex flex-col items-center gap-4">
               <CalendarDays className="h-12 w-12" />
               <p className="font-black uppercase tracking-[0.4em] text-[8px]">No recursive cycles</p>
            </div>
          ) : (
            subscriptions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-6 bg-[#0a0a16] rounded-[2.5rem] border border-white/[0.02] group transition-all hover:bg-white/[0.02]">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="font-black text-base">{sub.name}</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mt-1">
                      Cycle: {sub.billingCycle} • Status: Synced
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="font-black text-xl block tabular-nums">₹{sub.amount.toLocaleString('en-IN')}</span>
                    <span className="text-[8px] text-accent font-black uppercase tracking-widest">Active</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-white/10 hover:text-red-500" onClick={() => handleDelete(sub.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}