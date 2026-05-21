
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
    toast({ title: "Service Added", description: `${name} tracker is now live.` });
  };

  const handleDelete = (id: string) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'users', user.uid, 'subscriptions', id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Unsubscribed", description: "Payment record removed." });
  };

  const monthlyBurn = (subscriptions || []).reduce((acc, sub) => {
    return acc + (sub.billingCycle === 'monthly' ? sub.amount : sub.amount / 12);
  }, 0);

  return (
    <div className="min-h-screen pb-32">
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 z-50 bg-background/50 backdrop-blur-xl border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-2xl glass h-10 w-10" asChild>
            <Link href="/dashboard"><ChevronLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="text-xl font-black tracking-tight">Bill Tracker</h1>
        </div>
        <Button 
          size="icon" 
          className="rounded-2xl h-10 w-10 bg-primary shadow-xl"
          onClick={() => setIsAdding(!isAdding)}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </header>

      <main className="px-6 space-y-8 max-w-4xl mx-auto pt-6">
        <section className="bg-gradient-to-tr from-primary to-accent text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80 mb-2">Monthly Recurring</h2>
            <p className="text-5xl font-black tracking-tighter">₹{monthlyBurn.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            <div className="mt-8 flex items-center gap-2 bg-white/10 w-fit px-5 py-2 rounded-full border border-white/10 backdrop-blur-md">
              <Clock className="h-4 w-4 text-yellow-300" />
              <span className="text-[10px] font-black uppercase tracking-widest">{subscriptions?.length || 0} active commitments</span>
            </div>
          </div>
          <CreditCard className="absolute -bottom-10 -right-10 h-64 w-64 text-white/5 -rotate-12" />
        </section>

        {isAdding && (
          <div className="glass p-8 rounded-[3rem] space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <h3 className="text-lg font-black tracking-tight">New Service</h3>
            <div className="grid gap-4">
              <Input placeholder="Service Name (e.g. Spotify)" value={name} onChange={(e) => setName(e.target.value)} className="h-14 rounded-2xl glass border-none px-6" />
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold">₹</span>
                  <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-14 rounded-2xl glass border-none pl-10 px-6" />
                </div>
                <select 
                  className="h-14 rounded-2xl glass border-none px-6 font-black text-[10px] uppercase tracking-widest outline-none"
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
            <div className="text-center py-20 opacity-30 flex flex-col items-center gap-4">
               <CalendarDays className="h-12 w-12" />
               <p className="font-black uppercase tracking-[0.2em] text-xs">No recurring payments</p>
            </div>
          ) : (
            subscriptions.map((sub) => {
              const daysLeft = 28; // Simulated for MVP
              return (
                <div key={sub.id} className="flex items-center justify-between p-6 glass rounded-[2.5rem] border-none shadow-sm group">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:rotate-6 transition-transform">
                      <CheckCircle2 className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="font-black text-base">{sub.name}</p>
                      <p className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        daysLeft < 3 ? "text-destructive" : "text-muted-foreground"
                      )}>
                        Next: {daysLeft} days • {sub.billingCycle}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="font-black text-xl block tabular-nums">₹{sub.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      <span className="text-[10px] text-primary font-black uppercase tracking-widest">Active</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground/20 hover:text-destructive transition-colors" onClick={() => handleDelete(sub.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
