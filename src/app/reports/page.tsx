'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { generateMonthlyReport } from '@/ai/flows/monthly-report-flow';
import { analyzeSpendingDNA } from '@/ai/flows/habit-analysis-flow';
import { predictGoalManifestation } from '@/ai/flows/goal-predictor-flow';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  ChevronLeft, 
  Loader2, 
  BrainCircuit, 
  Target, 
  TrendingUp, 
  ShieldCheck, 
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Fingerprint
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function IntelligenceHubPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [report, setReport] = useState<any>(null);
  const [dna, setDna] = useState<any>(null);
  const [goalPredictions, setGoalPredictions] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc'), limit(100));
  }, [firestore, user]);

  const goalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'goals'));
  }, [firestore, user]);

  const { data: transactions } = useCollection(transactionsQuery);
  const { data: goals } = useCollection(goalsQuery);

  const runIntelligence = async () => {
    if (!transactions || transactions.length < 5 || isLoading) return;
    setIsLoading(true);
    try {
      const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const surplus = income - expense;

      const [r, d, g] = await Promise.all([
        generateMonthlyReport({
          userName: user?.displayName || 'Entity',
          month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
          income,
          expenses: expense,
          transactions: transactions.map(t => ({ category: t.category, amount: t.amount, type: t.type })),
          healthScore: 85 // Fallback if not available
        }),
        analyzeSpendingDNA({
          transactions: transactions.map(t => ({ merchant: t.merchant, category: t.category, amount: t.amount, date: t.date?.seconds ? new Date(t.date.seconds * 1000).toDateString() : 'Today' }))
        }),
        predictGoalManifestation({
          goals: (goals || []).map(g => ({ title: g.title, targetAmount: g.targetAmount, currentAmount: g.currentAmount, deadline: g.deadline })),
          monthlySurplus: surplus > 0 ? surplus : 10000
        })
      ]);
      setReport(r);
      setDna(d);
      setGoalPredictions(g);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (transactions && transactions.length > 5 && !report) {
      runIntelligence();
    }
  }, [transactions]);

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-44 selection:bg-primary/30">
      <header className="px-8 py-10 bg-[#020617]/90 backdrop-blur-3xl sticky top-0 z-50 border-b border-white/5">
        <div className="flex items-center gap-6 max-w-7xl mx-auto">
          <Button variant="ghost" size="icon" className="rounded-2xl glass h-14 w-14" asChild>
            <Link href="/dashboard"><ChevronLeft className="h-7 w-7" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight italic">Intelligence Hub</h1>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 mt-1">Executive Reports & DNA Analysis</p>
          </div>
        </div>
      </header>

      <main className="px-8 py-12 space-y-12 max-w-7xl mx-auto relative z-10">
        <AnimatePresence mode="wait">
           {isLoading ? (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 opacity-40">
                <Loader2 className="h-12 w-12 animate-spin mb-6 text-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em]">Synthesizing Executive Records...</p>
             </motion.div>
           ) : report ? (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                {/* Executive DNA Summary */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <Card className="rounded-[3.5rem] glass-dark border-none p-10 lg:col-span-2 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-10 opacity-5">
                         <Fingerprint className="h-40 w-40 text-primary" />
                      </div>
                      <div className="space-y-6">
                         <div className="inline-flex items-center gap-3 bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">
                            <Zap className="h-4 w-4 text-primary" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary">Behavioral Profile</span>
                         </div>
                         <h2 className="text-5xl font-black italic tracking-tighter text-glow">{dna?.spendingPersonality}</h2>
                         <p className="text-sm font-bold text-white/40 max-w-xl leading-relaxed italic">{report?.executiveSummary}</p>
                      </div>
                      <div className="mt-12 pt-10 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-8">
                         <div>
                            <p className="text-[8px] font-black uppercase text-white/20 tracking-widest mb-2">Top Obsession</p>
                            <p className="font-black text-lg">{dna?.topMerchantObsession}</p>
                         </div>
                         <div>
                            <p className="text-[8px] font-black uppercase text-white/20 tracking-widest mb-2">Peak Activity</p>
                            <p className="font-black text-lg">{dna?.peakSpendingHours}</p>
                         </div>
                         <div>
                            <p className="text-[8px] font-black uppercase text-white/20 tracking-widest mb-2">Protocol Status</p>
                            <p className="font-black text-lg text-emerald-500">Live Optimization</p>
                         </div>
                      </div>
                   </Card>

                   <Card className="rounded-[3.5rem] glass border-none p-10 bg-primary/5 flex flex-col justify-between border border-primary/20">
                      <div>
                         <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white/60 mb-8">Surgical Recommendation</h3>
                         <p className="text-lg font-black italic leading-snug text-primary">{dna?.improvementProtocol}</p>
                      </div>
                      <Button className="mt-10 h-14 rounded-2xl bg-white text-primary font-black uppercase text-[10px] tracking-widest hover:bg-white/90">Apply Optimization</Button>
                   </Card>
                </section>

                {/* Monthly Performance Matrix */}
                <section className="space-y-6">
                   <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white/20 px-4">Sector Efficiency Matrix</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {report?.sectorPerformance.map((sector: any, i: number) => (
                        <Card key={i} className="rounded-[2.5rem] glass-dark border-none p-8 hover:bg-white/[0.05] transition-all">
                           <div className="flex justify-between items-center mb-6">
                              <span className="font-black text-sm">{sector.category}</span>
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[8px] font-black uppercase border",
                                sector.efficiency === 'OPTIMAL' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                                sector.efficiency === 'SUBOPTIMAL' ? "bg-orange-500/10 border-orange-500/20 text-orange-500" :
                                "bg-rose-500/10 border-rose-500/20 text-rose-500"
                              )}>
                                 {sector.efficiency}
                              </span>
                           </div>
                           <p className="text-[11px] font-medium leading-relaxed text-white/40">{sector.analysis}</p>
                        </Card>
                      ))}
                   </div>
                </section>

                {/* Savings Goal Manifestation Pulse */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <Card className="rounded-[3.5rem] glass-dark border-none p-10">
                      <h3 className="text-xs font-black uppercase tracking-[0.4em] text-accent mb-10 flex items-center gap-3">
                         <Target className="h-5 w-5" /> Manifestation Forecast
                      </h3>
                      <div className="space-y-8">
                         {goalPredictions?.predictions.map((pred: any, i: number) => (
                            <div key={i} className="flex items-center justify-between group">
                               <div className="flex items-center gap-5">
                                  <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center border",
                                    pred.status === 'ON_TRACK' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                                  )}>
                                     <CheckCircle2 className="h-6 w-6" />
                                  </div>
                                  <div>
                                     <p className="font-black text-base">{pred.goalTitle}</p>
                                     <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">Est: {pred.estimatedCompletionDate}</p>
                                  </div>
                               </div>
                               <div className="text-right">
                                  <p className="text-lg font-black italic">{pred.probabilityOfSuccess}%</p>
                                  <p className="text-[8px] font-black uppercase tracking-widest text-white/20">Success Prob.</p>
                               </div>
                            </div>
                         ))}
                      </div>
                   </Card>

                   <Card className="rounded-[3.5rem] glass-dark border-none p-10 relative overflow-hidden bg-gradient-to-br from-accent/10 to-transparent">
                      <TrendingUp className="h-16 w-16 text-accent absolute -bottom-4 -right-4 opacity-10" />
                      <h3 className="text-xs font-black uppercase tracking-[0.4em] text-accent mb-8">Quantum Strategy</h3>
                      <p className="text-xl font-black italic leading-relaxed text-white/80">{goalPredictions?.manifestationSummary}</p>
                      <div className="mt-10 p-6 bg-white/5 rounded-3xl border border-white/5">
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-4 flex items-center gap-2">
                            <Zap className="h-3 w-3" /> Growth Logic
                         </h4>
                         <p className="text-xs font-bold text-white/40 italic">{report?.strategicForecast}</p>
                      </div>
                   </Card>
                </section>
             </motion.div>
           ) : (
             <div className="py-32 flex flex-col items-center justify-center text-center space-y-8 opacity-20">
                <FileText className="h-24 w-24" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em]">Awaiting Intelligence Initialization...</p>
             </div>
           )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}
