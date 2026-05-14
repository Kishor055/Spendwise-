
'use client';

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CreditCard, 
  Calendar, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  Bell,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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
    return query(collection(firestore, 'users', user.uid, 'subscriptions'), orderBy('name', 'asc'));
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
      nextBillingDate: new Date().toISOString()
    });
    setName('');
    setAmount('');
    setIsAdding(false);
    toast({ title: "Subscribed!", description: `${name} has been added to your tracker.` });
  };

  const handleDelete = (id: string) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'users', user.uid, 'subscriptions', id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Removed", description: "Subscription removed successfully." });
  };

  const totalMonthly = (subscriptions || []).reduce((acc, sub) => {
    return acc + (sub.billingCycle === 'monthly' ? sub.amount : sub.amount / 12);
  }, 0);

  return (
    <div className="min-h-screen pb-32">
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 z-50 bg-background/50 backdrop-blur-xl border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-2xl glass h-10 w-10" asChild>
            <Link href="/dashboard"><ChevronLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="text-xl font-black tracking-tight">Subscriptions</h1>
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
        <section className="bg-primary text-primary-foreground p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-2">Total Monthly Commitment</h2>
            <p className="text-4xl font-black tracking-tighter">${totalMonthly.toFixed(2)}</p>
            <div className="mt-6 flex items-center gap-2 bg-white/10 w-fit px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/5">
              <Bell className="h-3.5 w-3.5 text-accent" />
              <span className="text-[10px] font-black uppercase tracking-widest">{subscriptions?.length || 0} Active Services</span>
            </div>
          </div>
          <CreditCard className="absolute -bottom-10 -right-10 h-48 w-48 text-white/5 -rotate-12" />
        </section>

        {isAdding && (
          <div className="glass p-8 rounded-[3rem] space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-black">New Subscription</h3>
            <div className="grid gap-4">
              <Input placeholder="Service Name (e.g. Netflix)" value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-2xl" />
              <div className="flex gap-2">
                <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-12 rounded-2xl flex-1" />
                <select 
                  className="h-12 rounded-2xl glass border-none px-4 font-bold text-sm"
                  value={cycle}
                  onChange={(e) => setCycle(e.target.value as any)}
                >
                  <option value="monthly">/ mo</option>
                  <option value="yearly">/ yr</option>
                </select>
              </div>
              <Button className="w-full h-12 rounded-2xl font-black" onClick={handleAdd}>Save Subscription</Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {!subscriptions || subscriptions.length === 0 ? (
            <div className="text-center py-20 opacity-30 italic font-black uppercase text-xs tracking-widest">No recurring payments found</div>
          ) : (
            subscriptions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-6 glass rounded-[2.5rem] border-none shadow-sm transition-transform active:scale-95 group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-black text-sm">{sub.name}</p>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                      Next: {format(new Date(), 'MMM dd')} • {sub.billingCycle}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="font-black text-lg block tabular-nums">${sub.amount.toFixed(2)}</span>
                    <span className="text-[10px] text-muted-foreground font-black uppercase">Active</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive/30 hover:text-destructive" onClick={() => handleDelete(sub.id)}>
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
