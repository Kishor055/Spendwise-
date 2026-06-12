'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { getInvestmentRecommendations } from '@/ai/flows/investment-advisor-flow';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, 
  ChevronLeft, 
  Loader2, 
  Zap, 
  Target, 
  ShieldCheck, 
  PieChart as PieChartIcon,
  ArrowRight,
  Sparkles,
  BarChart3,
  LineChart
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';

const COLORS = ['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B'];

export default function InvestmentTerminalPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [recommendations, setRecommendations] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [risk, setRisk] = useState<'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE'>('BALANCED');

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc'), limit(100));
  }, [firestore, user]);

  const { data: transactions } = useCollection(transactionsQuery);

  const runAnalysis = async () => {
    if (!transactions || transactions.length < 5 || isLoading) return;
    setIsLoading(true);
    try {
      const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const savings = Math.max(0, income - expense);
      
      const spendingHabits = Object.entries(
        transactions.filter(t => t.type === 'expense').reduce((acc: any, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {})
      ).map(([category, amount]) => ({ category, amount: amount as number }));

      const result = await getInvestmentRecommendations({
        income: income || 100000,
        savings: savings || 20000,
        spendingHabits,
        riskPreference: risk
      });
      setRecommendations(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (transactions && transactions.length > 5 && !recommendations) {
      runAnalysis();
    }
  }, [transactions]);

  const pieData = recommendations?.portfolioSuggestions.map((p: any) => ({
    name: p.assetClass,
    value: p.allocationPercentage
  })) || [];

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-44 selection:bg-emerald-500/30">
      <header className="px-8 py-10 bg-[#020617]/90 backdrop-blur-3xl sticky top-0 z-50 border-b border-white/5">
        <div className="flex items-center gap-6 max-w-7xl mx-auto">
          <Button variant="ghost" size="icon" className="rounded-2xl glass h-14 w-14" asChild>
            <Link href="/dashboard"><ChevronLeft className="h-7 w-7" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight italic">Wealth Terminal</h1>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 mt-1">Strategic Asset Deployment</p>
          </div>
        </div>
      </header>

      <main className="px-8 py-12 space-y-12 max-w-7xl mx-auto relative z-10">
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Card className="rounded-[3.5rem] glass-dark border-none p-10 lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-emerald-500/10 to-transparent">
              <div className="absolute top-0 right-0 p-10 opacity-5">
                 <ShieldCheck className="h-32 w-32 text-emerald-500" />
              </div>
              <div className="flex flex-col md:flex-row items-center gap-12">
                 <div className="relative">
                    <svg className="w-40 h-40 transform -rotate-90">
                       <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                       <circle 
                         cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="8" fill="transparent" 
                         strokeDasharray={452.39}
                         strokeDashoffset={452.39 - (452.39 * (recommendations?.investmentScore || 0)) / 100}
                         className="text-emerald-500 transition-all duration-1000"
                       />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <span className="text-4xl font-black italic tracking-tighter">{recommendations?.investmentScore || '--'}</span>
                       <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/40">Wealth IQ</span>
                    </div>
                 </div>
                 <div className="flex-1 space-y-6">
                    <h2 className="text-3xl font-black italic tracking-tighter leading-tight">Strategic<br />Allocation Pulse.</h2>
                    <div className="flex gap-3">
                       {['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'].map((r) => (
                          <button 
                            key={r}
                            onClick={() => {
                              setRisk(r as any);
                              runAnalysis();
                            }}
                            className={cn(
                              "px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all",
                              risk === r ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                            )}
                          >
                            {r}
                          </button>
                       ))}
                    </div>
                 </div>
              </div>
           </Card>

           <Card className="rounded-[3.5rem] glass-dark border-none p-10 flex flex-col justify-center gap-6 relative group overflow-hidden">
              <Sparkles className="h-10 w-10 text-primary absolute -bottom-2 -right-2 opacity-10 group-hover:scale-125 transition-transform" />
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">Market Insight</p>
              <p className="text-sm font-bold leading-relaxed italic">
                 {recommendations?.strategicInsight || "Initialize analysis to project your wealth trajectory..."}
              </p>
           </Card>
        </section>

        <AnimatePresence mode="wait">
           {isLoading ? (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 opacity-40">
                <Loader2 className="h-12 w-12 animate-spin mb-6 text-emerald-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em]">Synchronizing Portfolio Vectors...</p>
             </motion.div>
           ) : recommendations ? (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="grid grid-cols-1 lg:grid-cols-3 gap-8"
             >
                <Card className="rounded-[3.5rem] glass-dark border-none p-10 lg:col-span-2">
                   <div className="flex justify-between items-center mb-10">
                      <h3 className="text-xs font-black uppercase tracking-[0.4em] text-emerald-500 flex items-center gap-3">
                         <BarChart3 className="h-5 w-5" /> Suggested Deployment
                      </h3>
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Optimized for India</span>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                      <div className="h-64 w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                               <Pie
                                 data={pieData}
                                 cx="50%" cy="50%"
                                 innerRadius={60} outerRadius={100}
                                 paddingAngle={8}
                                 dataKey="value"
                               >
                                  {pieData.map((_: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                               </Pie>
                               <Tooltip 
                                 contentStyle={{ background: '#0a0a16', border: 'none', borderRadius: '1.5rem', fontWeight: '900' }}
                                 itemStyle={{ color: '#fff', fontSize: '10px' }}
                               />
                               <Legend verticalAlign="bottom" iconType="circle" />
                            </PieChart>
                         </ResponsiveContainer>
                      </div>
                      <div className="space-y-6">
                         {recommendations.portfolioSuggestions.map((p: any, i: number) => (
                           <div key={i} className="space-y-2">
                              <div className="flex justify-between items-center">
                                 <span className="font-black text-sm">{p.assetClass}</span>
                                 <span className="font-black text-emerald-500 text-xs">{p.allocationPercentage}%</span>
                              </div>
                              <p className="text-[10px] text-white/40 leading-relaxed">{p.reasoning}</p>
                           </div>
                         ))}
                      </div>
                   </div>
                </Card>

                <div className="space-y-8">
                   <Card className="rounded-[3rem] glass-dark border-none p-8 space-y-6 bg-primary/5 border border-primary/10">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
                         <Zap className="h-5 w-5" /> SIP Protocol
                      </h4>
                      {recommendations.sipRecommendations.map((sip: any, i: number) => (
                        <div key={i} className="flex justify-between items-center group cursor-default">
                           <div>
                              <p className="font-black text-sm group-hover:text-primary transition-colors">{sip.fundType}</p>
                              <p className="text-[9px] font-black uppercase text-white/20 tracking-widest">{sip.timeHorizon}</p>
                           </div>
                           <p className="text-xl font-black italic tracking-tighter">₹{sip.suggestedAmount.toLocaleString()}</p>
                        </div>
                      ))}
                   </Card>

                   <Card className="rounded-[3rem] glass-dark border-none p-8 space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                         <ShieldCheck className="h-5 w-5 text-accent" />
                         <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Risk Pulse</h4>
                      </div>
                      <p className="text-xs font-bold leading-relaxed text-white/60">
                         {recommendations.riskAnalysis}
                      </p>
                   </Card>
                </div>
             </motion.div>
           ) : (
             <div className="py-32 flex flex-col items-center justify-center text-center space-y-8 opacity-20">
                <LineChart className="h-24 w-24" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em]">Awaiting Portfolio Initialization...</p>
             </div>
           )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}
