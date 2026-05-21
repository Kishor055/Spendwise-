'use client';

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, serverTimestamp } from 'firebase/firestore';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Target, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  Rocket
} from 'lucide-react';
import Link from 'next/link';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export default function GoalsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');

  const goalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'goals'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);

  const { data: goals } = useCollection(goalsQuery);

  const handleAdd = () => {
    if (!user || !firestore || !title || !target) return;
    const colRef = collection(firestore, 'users', user.uid, 'goals');
    addDocumentNonBlocking(colRef, {
      userId: user.uid,
      title,
      targetAmount: parseFloat(target),
      currentAmount: 0,
      createdAt: serverTimestamp()
    });
    setTitle('');
    setTarget('');
    setIsAdding(false);
    toast({ title: "Goal Set!", description: `Time to crush your ${title} goal!` });
  };

  const handleAddMoney = (id: string, current: number, amount: number) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'users', user.uid, 'goals', id);
    updateDocumentNonBlocking(docRef, {
      currentAmount: current + amount
    });
    toast({ title: "Money Saved!", description: "Progress updated." });
  };

  const handleDelete = (id: string) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'users', user.uid, 'goals', id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Deleted", description: "Goal removed." });
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-44">
      <header className="px-6 py-10 bg-[#020617]/90 backdrop-blur-3xl sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-xl bg-white/[0.03] h-10 w-10" asChild>
              <Link href="/dashboard"><ChevronLeft className="h-5 w-5" /></Link>
            </Button>
            <h1 className="text-xl font-black tracking-tight">Strategic Targets</h1>
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
            <Trophy className="h-8 w-8 mb-4 text-accent" />
            <h2 className="text-4xl font-black tracking-tighter">Manifest All.</h2>
            <p className="font-bold opacity-40 mt-2 text-sm uppercase tracking-widest">Financial Milestones</p>
          </div>
          <Rocket className="absolute -bottom-10 -right-10 h-48 w-48 text-white/5 -rotate-12" />
        </section>

        {isAdding && (
          <div className="bg-[#0a0a16] p-8 rounded-[2.5rem] border border-white/[0.05] space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-accent">Initialize Target</h3>
            <div className="grid gap-4">
              <Input placeholder="Goal Title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 rounded-2xl bg-white/[0.02] border-white/5" />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-white/20">₹</span>
                <Input type="number" placeholder="Target Amount" value={target} onChange={(e) => setTarget(e.target.value)} className="h-12 rounded-2xl bg-white/[0.02] border-white/5 pl-10" />
              </div>
              <Button className="w-full h-12 rounded-2xl font-black" onClick={handleAdd}>Confirm Launch</Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {!goals || goals.length === 0 ? (
            <div className="text-center py-20 opacity-10 font-black uppercase text-[8px] tracking-[0.4em] flex flex-col items-center gap-4">
               <Target className="h-12 w-12" />
               No active missions
            </div>
          ) : (
            goals.map((goal) => {
              const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
              return (
                <div key={goal.id} className="bg-[#0a0a16] p-8 rounded-[2.5rem] border border-white/[0.02] shadow-sm space-y-6 group transition-all hover:bg-white/[0.02]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-accent/5 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                        <Trophy className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black tracking-tight">{goal.title}</h3>
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mt-1">
                          ₹{goal.currentAmount.toLocaleString('en-IN')} / ₹{goal.targetAmount.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-white/10 hover:text-red-500" onClick={() => handleDelete(goal.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                      <span className="text-accent">{Math.round(progress)}% Optimized</span>
                      <span className="text-white/20">₹{(goal.targetAmount - goal.currentAmount).toLocaleString('en-IN')} Remaining</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-white/[0.03]" indicatorClassName="bg-accent" />
                  </div>

                  <div className="flex gap-2">
                    {[1000, 5000, 10000].map((amount) => (
                      <Button 
                        key={amount} 
                        variant="ghost" 
                        size="sm" 
                        className="flex-1 rounded-xl font-black text-[9px] h-10 bg-white/[0.03] hover:bg-white/[0.08]"
                        onClick={() => handleAddMoney(goal.id, goal.currentAmount, amount)}
                      >
                        +₹{amount.toLocaleString('en-IN')}
                      </Button>
                    ))}
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