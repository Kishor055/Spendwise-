
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
  TrendingUp,
  DollarSign,
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
    <div className="min-h-screen pb-32">
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 z-50 bg-background/50 backdrop-blur-xl border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-2xl glass h-10 w-10" asChild>
            <Link href="/dashboard"><ChevronLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="text-xl font-black tracking-tight">Wealth Goals</h1>
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
        <section className="bg-gradient-to-tr from-accent to-primary text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <Trophy className="h-10 w-10 mb-4 text-yellow-300" />
            <h2 className="text-4xl font-black tracking-tighter">Dream Big.</h2>
            <p className="font-bold opacity-80 mt-2">Track your progress to financial freedom.</p>
          </div>
          <Rocket className="absolute -bottom-10 -right-10 h-48 w-48 text-white/10 -rotate-12" />
        </section>

        {isAdding && (
          <div className="glass p-8 rounded-[3rem] space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-black">Set New Target</h3>
            <div className="grid gap-4">
              <Input placeholder="Goal Title (e.g. New Macbook)" value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 rounded-2xl" />
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="number" placeholder="Target Amount" value={target} onChange={(e) => setTarget(e.target.value)} className="h-12 rounded-2xl pl-10" />
              </div>
              <Button className="w-full h-12 rounded-2xl font-black" onClick={handleAdd}>Launch Goal</Button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {!goals || goals.length === 0 ? (
            <div className="text-center py-20 opacity-30 italic font-black uppercase text-xs tracking-widest flex flex-col items-center gap-4">
               <Target className="h-12 w-12" />
               No active goals
            </div>
          ) : (
            goals.map((goal) => {
              const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
              return (
                <div key={goal.id} className="glass p-8 rounded-[3rem] border-none shadow-sm space-y-6 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent group-hover:rotate-6 transition-transform">
                        <Trophy className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black tracking-tight">{goal.title}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          ${goal.currentAmount.toLocaleString()} of ${goal.targetAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground/30 hover:text-destructive" onClick={() => handleDelete(goal.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-primary">{Math.round(progress)}% Complete</span>
                      <span className="text-muted-foreground">${(goal.targetAmount - goal.currentAmount).toLocaleString()} left</span>
                    </div>
                    <Progress value={progress} className="h-3 bg-muted" indicatorClassName="bg-accent" />
                  </div>

                  <div className="flex gap-2">
                    {[50, 100, 500].map((amount) => (
                      <Button 
                        key={amount} 
                        variant="secondary" 
                        size="sm" 
                        className="flex-1 rounded-full font-black text-[10px] h-10"
                        onClick={() => handleAddMoney(goal.id, goal.currentAmount, amount)}
                      >
                        +${amount}
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
