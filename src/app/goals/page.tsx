
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
  Rocket,
  Zap,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function GoalsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');

  const goalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'goals'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);

  const { data: goals, isLoading } = useCollection(goalsQuery);

  const handleAdd = () => {
    if (!user || !firestore || !title || !target) return;
    const colRef = collection(firestore, 'users', user.uid, 'goals');
    addDocumentNonBlocking(colRef, {
      userId: user.uid,
      title,
      targetAmount: parseFloat(target),
      currentAmount: 0,
      deadline: deadline || null,
      createdAt: serverTimestamp(),
      priority: 'Medium'
    });
    setTitle('');
    setTarget('');
    setDeadline('');
    setIsAdding(false);
    toast({ title: "Manifest Protocol Set", description: `${title} target initialized.` });
  };

  const handleAddMoney = (id: string, current: number, amount: number) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'users', user.uid, 'goals', id);
    updateDocumentNonBlocking(docRef, {
      currentAmount: current + amount
    });
  };

  const handleDelete = (id: string) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'users', user.uid, 'goals', id);
    deleteDocumentNonBlocking(docRef);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-44 selection:bg-accent/30">
      <header className="px-8 py-10 bg-[#020617]/90 backdrop-blur-3xl sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" className="rounded-2xl glass h-14 w-14" asChild>
              <Link href="/dashboard"><ChevronLeft className="h-7 w-7" /></Link>
            </Button>
            <div>
              <h1 className="text-2xl font-black tracking-tighter italic">Strategic Targets</h1>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 mt-1">Manifestation Matrix</p>
            </div>
          </div>
          <Button 
            size="icon" 
            className="rounded-2xl h-14 w-14 bg-accent shadow-2xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all"
            onClick={() => setIsAdding(!isAdding)}
          >
            <Plus className="h-7 w-7" />
          </Button>
        </div>
      </header>

      <main className="px-8 space-y-10 max-w-5xl mx-auto py-12 relative z-10">
        <section className="p-12 rounded-[3.5rem] glass-dark relative overflow-hidden group">
          <div className="absolute -bottom-20 -right-20 opacity-5 transition-transform group-hover:scale-110 group-hover:-rotate-12">
            <Rocket size={400} />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-3 bg-accent/10 px-6 py-2 rounded-full border border-accent/20 mb-6">
              <BrainCircuit className="h-4 w-4 text-accent" />
              <span className="text-[10px] font-black uppercase tracking-widest text-accent">Dream Planner v4.0</span>
            </div>
            <h2 className="text-5xl font-black tracking-tighter italic leading-none">Manifest<br />Everything.</h2>
            <p className="text-white/40 font-bold max-w-sm mt-6 text-sm leading-relaxed">Convert your liquid capital into high-value commercial assets. AI calculates your daily manifestation path.</p>
          </div>
        </section>

        <AnimatePresence>
          {isAdding && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-10 rounded-[3rem] glass border border-white/10 space-y-8 shadow-3xl"
            >
              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-accent">Initialize Target Parameter</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-4">Target Identity</label>
                  <Input placeholder="E.g. Tesla Model S, Luxury Villa" value={title} onChange={(e) => setTitle(e.target.value)} className="h-14 rounded-2xl glass border-white/5 px-6 font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-4">Quantifiable Value (₹)</label>
                  <Input type="number" placeholder="Value Vector" value={target} onChange={(e) => setTarget(e.target.value)} className="h-14 rounded-2xl glass border-white/5 px-6 font-bold" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-4">Manifestation Deadline</label>
                  <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="h-14 rounded-2xl glass border-white/5 px-6 font-bold" />
                </div>
              </div>
              <Button className="w-full h-16 rounded-[2rem] bg-accent text-accent-foreground font-black uppercase text-[10px] tracking-[0.4em] shadow-3xl shadow-accent/20 hover:bg-accent/90" onClick={handleAdd}>Enable Target Protocol</Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 gap-8">
          {isLoading ? (
            <div className="py-20 flex justify-center"><Loader2 className="h-12 w-12 animate-spin text-accent" /></div>
          ) : !goals || goals.length === 0 ? (
            <div className="text-center py-32 opacity-10 flex flex-col items-center gap-6">
               <Target className="h-24 w-24" />
               <p className="font-black uppercase tracking-[0.5em] text-[10px]">No Strategic Targets Identified</p>
            </div>
          ) : (
            goals.map((goal, i) => {
              const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
              const remaining = goal.targetAmount - goal.currentAmount;
              
              return (
                <motion.div 
                  key={goal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-10 rounded-[3.5rem] glass-dark border border-white/[0.03] space-y-10 group hover:bg-white/[0.05] transition-all shadow-2xl relative overflow-hidden"
                >
                  {progress === 100 && (
                     <div className="absolute top-0 right-0 p-8 bg-emerald-500/10 text-emerald-500 rounded-bl-[3rem] font-black uppercase text-[8px] tracking-[0.3em] flex items-center gap-2">
                        <Trophy className="h-3 w-3" /> Manifested
                     </div>
                  )}

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-8">
                      <div className="w-24 h-24 rounded-3xl bg-accent/5 flex items-center justify-center text-accent border border-accent/10 group-hover:scale-110 transition-transform shadow-xl">
                        <Target className="h-10 w-10" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-black tracking-tighter italic">{goal.title}</h3>
                        <div className="flex items-center gap-5 mt-3">
                           <span className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {goal.deadline ? format(new Date(goal.deadline), 'MMM dd, yyyy') : "Open Temporal Path"}
                           </span>
                           <span className="h-1 w-1 rounded-full bg-white/10" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">₹{goal.targetAmount.toLocaleString()} Total</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 self-end md:self-auto">
                       <div className="text-right">
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Accumulated Vector</p>
                          <p className="text-3xl font-black italic tracking-tighter">₹{goal.currentAmount.toLocaleString()}</p>
                       </div>
                       <Button variant="ghost" size="icon" className="h-12 w-12 text-white/10 hover:text-rose-500 rounded-2xl bg-white/[0.02]" onClick={() => handleDelete(goal.id)}>
                         <Trash2 className="h-5 w-5" />
                       </Button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em]">
                      <span className="text-accent flex items-center gap-3">
                         <TrendingUp className="h-4 w-4" /> 
                         {Math.round(progress)}% Optimized
                      </span>
                      <span className="text-white/20 italic">Gap: ₹{remaining.toLocaleString()}</span>
                    </div>
                    <div className="relative">
                       <Progress value={progress} className="h-4 bg-white/[0.03]" indicatorClassName="bg-accent shadow-[0_0_30px_rgba(191,100,50,0.6)]" />
                       {progress > 0 && progress < 100 && (
                         <div 
                           className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-3xl flex items-center justify-center transition-all duration-1000"
                           style={{ left: `calc(${progress}% - 16px)` }}
                         >
                            <Sparkles className="h-4 w-4 text-accent" />
                         </div>
                       )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1000, 5000, 10000, 50000].map((amount) => (
                      <Button 
                        key={amount} 
                        variant="ghost" 
                        className="h-16 rounded-[1.8rem] bg-white/[0.03] border border-white/5 hover:bg-primary/20 hover:text-primary transition-all font-black text-[10px] uppercase tracking-widest"
                        onClick={() => handleAddMoney(goal.id, goal.currentAmount, amount)}
                      >
                        +₹{amount.toLocaleString()}
                      </Button>
                    ))}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
