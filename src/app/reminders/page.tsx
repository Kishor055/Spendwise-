'use client';

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, serverTimestamp } from 'firebase/firestore';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Bell, 
  Calendar, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  Clock, 
  CreditCard,
  Zap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const REMINDER_TYPES = ['Electricity', 'EMI', 'Rent', 'Credit Card', 'Recharge', 'Other'];

export default function RemindersPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState(REMINDER_TYPES[0]);
  const [dueDate, setDueDate] = useState('');

  const remindersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'reminders'), orderBy('dueDate', 'asc'));
  }, [firestore, user]);

  const { data: reminders } = useCollection(remindersQuery);

  const handleAdd = () => {
    if (!user || !firestore || !title || !amount || !dueDate) return;
    const colRef = collection(firestore, 'users', user.uid, 'reminders');
    addDocumentNonBlocking(colRef, {
      userId: user.uid,
      title,
      amount: parseFloat(amount),
      dueDate: new Date(dueDate).toISOString(),
      type,
      notified: false
    });
    setTitle('');
    setAmount('');
    setDueDate('');
    setIsAdding(false);
    toast({ title: "Reminder Initialized", description: `${title} scheduled for monitoring.` });
  };

  const handleToggleDone = (id: string, notified: boolean) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'users', user.uid, 'reminders', id);
    updateDocumentNonBlocking(docRef, { notified: !notified });
  };

  const handleDelete = (id: string) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'users', user.uid, 'reminders', id);
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
              <h1 className="text-2xl font-black tracking-tight italic">Temporal Alerts</h1>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 mt-1">Scheduled Commitments</p>
            </div>
          </div>
          <Button size="icon" className="rounded-2xl h-14 w-14 bg-accent shadow-2xl shadow-accent/20" onClick={() => setIsAdding(!isAdding)}>
            <Plus className="h-7 w-7" />
          </Button>
        </div>
      </header>

      <main className="px-8 space-y-8 max-w-5xl mx-auto py-10">
        <section className="p-10 rounded-[3rem] glass-dark relative overflow-hidden bg-gradient-to-br from-accent/10 to-transparent">
          <div className="absolute -top-10 -right-10 opacity-5">
            <Bell className="h-64 w-64 rotate-12" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent mb-3">System Alerts</p>
            <h2 className="text-4xl font-black italic tracking-tighter">Never Miss<br />A Pulse.</h2>
          </div>
        </section>

        {isAdding && (
          <div className="p-8 rounded-[3rem] glass border border-white/10 space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-accent">Initialize Reminder</h3>
            <div className="grid gap-6">
              <Input placeholder="Reminder Title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-14 rounded-2xl bg-white/[0.03] border-white/10 px-6 font-bold" />
              <div className="grid grid-cols-2 gap-4">
                 <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-white/20">₹</span>
                    <Input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-14 rounded-2xl bg-white/[0.03] border-white/10 pl-12 font-bold" />
                 </div>
                 <select 
                    className="h-14 rounded-2xl bg-[#0a0a16] border border-white/10 px-6 font-bold text-xs uppercase tracking-widest outline-none"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    {REMINDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
              </div>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-14 rounded-2xl bg-white/[0.03] border-white/10 px-6 font-bold" />
              <Button className="w-full h-16 rounded-2xl bg-accent text-accent-foreground font-black uppercase text-[10px] tracking-widest shadow-2xl" onClick={handleAdd}>Enable Link</Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {!reminders || reminders.length === 0 ? (
            <div className="py-20 text-center opacity-10 flex flex-col items-center gap-4">
              <Clock className="h-16 w-16" />
              <p className="font-black uppercase tracking-[0.4em] text-[10px]">No active temporal cycles</p>
            </div>
          ) : (
            reminders.map((reminder) => (
              <div key={reminder.id} className={cn(
                "p-6 rounded-[2.5rem] border transition-all flex items-center justify-between group",
                reminder.notified ? "bg-white/[0.02] border-white/5 opacity-40" : "glass-dark border-white/10"
              )}>
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => handleToggleDone(reminder.id, reminder.notified)}
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                      reminder.notified ? "bg-emerald-500/20 text-emerald-500" : "bg-white/[0.05] text-white/20 hover:bg-white/10"
                    )}
                  >
                    {reminder.notified ? <CheckCircle2 className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                  </button>
                  <div>
                    <h3 className={cn("text-lg font-black", reminder.notified && "line-through")}>{reminder.title}</h3>
                    <div className="flex items-center gap-4 mt-1">
                       <span className="text-[9px] font-black uppercase tracking-widest text-white/30">{reminder.type}</span>
                       <span className="text-[9px] font-black uppercase tracking-widest text-accent flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(reminder.dueDate), 'MMM dd')}
                       </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-xl font-black italic tracking-tighter block">₹{reminder.amount.toLocaleString()}</span>
                    <span className={cn(
                      "text-[8px] font-black uppercase tracking-widest block mt-1",
                      reminder.notified ? "text-emerald-500" : "text-white/20"
                    )}>
                      {reminder.notified ? "Settled" : "Pending"}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-white/10 hover:text-rose-500 rounded-xl" onClick={() => handleDelete(reminder.id)}>
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
