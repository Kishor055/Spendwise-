"use client";

import { useMemo, useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Card } from '@/components/ui/card';
import { 
  Loader2, 
  TrendingUp, 
  Sparkles,
  BrainCircuit,
  Wallet2,
  TrendingDown,
  CircleDollarSign,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  History,
  Trophy,
  Flame,
  LayoutGrid,
  BarChart3,
  LineChart,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getBalanceForecast } from '@/ai/flows/predictive-forecast-flow';
import { analyzeSubscriptions } from '@/ai/flows/subscription-analyzer-flow';
import Link from 'next/link';
import { 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  BarChart, 
  Bar,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  YAxis,
  CartesianGrid
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [forecast, setForecast] = useState<any>(null);
  const [subsAnalysis, setSubsAnalysis] = useState<any>(null);
  const [isIntelligenceRunning, setIsIntelligenceRunning] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profile } = useDoc(userDocRef);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc'), limit(50));
  }, [firestore, user]);

  const budgetsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'budgets'));
  }, [firestore, user]);

  const remindersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'reminders'));
  }, [firestore, user]);

  const { data: transactions, isLoading: isTransactionsLoading } = useCollection(transactionsQuery);
  const { data: budgets } = useCollection(budgetsQuery);
  const { data: reminders } = useCollection(remindersQuery);

  const stats = useMemo(() => {
    if (!transactions) return { balance: 0, income: 0, expense: 0, healthScore: 0 };
    const totals = transactions.reduce((acc, tx) => {
      if (tx.type === 'income') { acc.income += tx.amount; acc.balance += tx.amount; }
      else { acc.expense += tx.amount; acc.balance -= tx.amount; }
      return acc;
    }, { balance: 0, income: 0, expense: 0 });
    const savingsRate = totals.income > 0 ? ((totals.income - totals.expense) / totals.income) * 100 : 0;
    return { ...totals, healthScore: Math.round(Math.min(100, Math.max(0, savingsRate))) };
  }, [transactions]);

  useEffect(() => {
    async function runIntelligence() {
      if (!transactions || transactions.length < 5 || isIntelligenceRunning) return;
      setIsIntelligenceRunning(true);
      try {
        const [f, s] = await Promise.all([
          getBalanceForecast({
            currentBalance: stats.balance,
            transactions: transactions.map(t => ({ 
              amount: t.amount, 
              type: t.type, 
              category: t.category,
              date: t.date?.seconds ? new Date(t.date.seconds * 1000).toISOString() : new Date().toISOString() 
            })),
            reminders: (reminders || []).map(r => ({ amount: r.amount, dueDate: r.dueDate, type: r.type })),
            budgets: (budgets || []).map(b => ({ category: b.category, limit: b.limit }))
          }),
          analyzeSubscriptions({
            transactions: transactions.filter(t => t.type === 'expense').map(t => ({ merchant: t.merchant || t.category, category: t.category, amount: t.amount, date: t.date?.seconds ? new Date(t.date.seconds * 1000).toISOString() : new Date().toISOString() }))
          })
        ]);
        setForecast(f);
        setSubsAnalysis(s);
      } catch (e) {
        console.error('Intelligence Error:', e);
      } finally {
        setIsIntelligenceRunning(false);
      }
    }
    if (mounted && transactions && transactions.length > 5) runIntelligence();
  }, [mounted, transactions, stats.balance, reminders, budgets]);

  if (!mounted || isUserLoading || (isTransactionsLoading && !transactions)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#020617]">
        <div className="relative">
          <Loader2 className="h-12 w-12 text-primary animate-spin opacity-50" />
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-44 text-white bg-[#020617] selection:bg-primary/30">
      <header className="px-8 py-10 sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-3xl border-b border-white/[0.05]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 relative group overflow-hidden">
              <BrainCircuit className="w-7 h-7 text-white relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <h1 className="text-2xl font-black italic tracking-tighter">SpendWise 3.0</h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/40 font-black uppercase tracking-[0.4em]">Neural Co-Pilot</span>
                <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </div>
          <div className="flex gap-4">
             <div className="hidden md:flex flex-col items-end mr-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Identity Tier</p>
                <p className="text-xs font-black italic text-primary">{profile?.rank || 'Novice'}</p>
             </div>
             <Link href="/subscriptions" className="glass h-12 w-12 rounded-2xl flex items-center justify-center relative hover:bg-white/10 transition-colors">
                <CreditCard className="h-5 w-5 text-accent" />
                {subsAnalysis?.detectedSubscriptions?.length > 0 && (
                   <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-pulse border-2 border-[#020617]" />
                )}
             </Link>
             <Link href="/ai-assistant" className="bg-primary h-12 w-12 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 hover:scale-105 transition-transform active:scale-95">
                <Sparkles className="h-5 w-5 text-white" />
             </Link>
          </div>
        </div>
      </header>

      <main className="px-8 py-12 space-y-12 max-w-7xl mx-auto relative z-10">
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Neural Streak', value: `${profile?.streak || 12} Days`, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
            { label: 'Vitality Score', value: `${stats.healthScore}%`, icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            { label: 'Matrix Rank', value: profile?.rank || 'Elite', icon: Trophy, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Liquidity', value: `₹${stats.balance.toLocaleString()}`, icon: Wallet2, color: 'text-accent', bg: 'bg-accent/10' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="rounded-[2.5rem] glass-dark border-none p-8 hover:bg-white/[0.05] transition-all group overflow-hidden relative">
                <div className={cn("absolute -right-4 -bottom-4 opacity-5 transition-transform group-hover:scale-110 group-hover:rotate-12", item.color)}>
                  <item.icon size={120} />
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black uppercase text-white/30 tracking-[0.3em]">{item.label}</p>
                    <div className={cn("p-2 rounded-xl", item.bg)}>
                      <item.icon className={cn("h-4 w-4", item.color)} />
                    </div>
                  </div>
                  <h3 className="text-3xl font-black italic tracking-tighter">{item.value}</h3>
                </div>
              </Card>
            </motion.div>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Card className="rounded-[3.5rem] glass-dark border-none p-10 lg:col-span-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-5">
                 <Zap className="h-32 w-32 text-accent" />
              </div>
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-xs font-black uppercase tracking-[0.4em] text-accent flex items-center gap-3">
                   <TrendingUp className="h-5 w-5" /> Quantum Pulse Forecast
                </h2>
                <div className="flex gap-2">
                   {['7D', '30D', '90D'].map((d) => (
                      <span key={d} className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black uppercase tracking-widest text-white/40">{d}</span>
                   ))}
                </div>
              </div>
              <div className="h-72 w-full">
                 {forecast ? (
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={forecast.overallForecast}>
                          <defs>
                            <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.03} />
                          <XAxis dataKey="days" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: 'rgba(255,255,255,0.2)' }} />
                          <YAxis hide />
                          <Tooltip 
                            contentStyle={{ background: '#0a0a16', border: 'none', borderRadius: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }} 
                            itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: '900' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="predictedBalance" 
                            stroke="hsl(var(--accent))" 
                            strokeWidth={4} 
                            fillOpacity={1} 
                            fill="url(#colorBal)" 
                          />
                       </AreaChart>
                    </ResponsiveContainer>
                 ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-10 gap-4">
                       <Loader2 className="h-10 w-10 animate-spin" />
                       <p className="text-[10px] font-black uppercase tracking-[0.5em]">Synthesizing Temporal Vectors...</p>
                    </div>
                 )}
              </div>
              <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                 <p className="text-xs font-bold text-white/40 max-w-md italic">
                    {forecast?.strategicInsight || "Initializing predictive modeling for your spending DNA..."}
                 </p>
                 <div className="flex items-center gap-4">
                    <div className="text-right">
                       <p className="text-[8px] font-black uppercase text-white/20">AI Confidence</p>
                       <p className="text-[10px] font-black text-accent">{Math.round((forecast?.overallForecast?.[1]?.confidence || 0) * 100)}%</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-white/10">
                       <LineChart className="h-5 w-5" />
                    </Button>
                 </div>
              </div>
           </Card>

           <div className="space-y-8">
              <Card className="rounded-[3.5rem] glass-dark border-none p-10 flex flex-col justify-between group h-full">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-[0.4em] text-primary mb-10 flex items-center gap-3">
                     <BarChart3 className="h-5 w-5" /> Sector Projections
                  </h2>
                  <div className="space-y-8">
                     {forecast?.categoryPredictions?.slice(0, 4).map((pred: any, i: number) => (
                        <div key={i} className="space-y-3">
                           <div className="flex justify-between items-center">
                              <span className="font-black text-sm">{pred.category}</span>
                              <div className="flex items-center gap-2">
                                 {pred.trend === 'UP' ? <TrendingUp className="h-3 w-3 text-rose-500" /> : <TrendingDown className="h-3 w-3 text-emerald-500" />}
                                 <span className="font-black italic text-base">₹{pred.predictedAmount.toLocaleString()}</span>
                              </div>
                           </div>
                           <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full rounded-full transition-all duration-1000", pred.riskScore > 70 ? "bg-rose-500" : "bg-primary")} 
                                style={{ width: `${Math.min(100, (pred.predictedAmount / (stats.income / 5)) * 100)}%` }} 
                              />
                           </div>
                        </div>
                     ))}
                     {(!forecast || !forecast.categoryPredictions) && (
                        <div className="text-center py-20 opacity-10 flex flex-col items-center gap-4">
                           <Activity className="h-10 w-10 animate-pulse" />
                           <p className="text-[9px] font-black uppercase tracking-widest">Simulating Outflows...</p>
                        </div>
                     )}
                  </div>
                </div>
                <Button asChild className="mt-10 w-full h-16 rounded-[2rem] bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all font-black text-[10px] uppercase tracking-[0.2em] border border-primary/20">
                   <Link href="/analytics">Detailed Matrix Analysis</Link>
                </Button>
              </Card>
           </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Card className="rounded-[3.5rem] glass-dark border-none p-10 flex flex-col justify-between">
              <div>
                <h2 className="text-xs font-black uppercase tracking-[0.4em] text-primary mb-10 flex items-center gap-3">
                   <CreditCard className="h-5 w-5" /> Detected Leaks
                </h2>
                <div className="space-y-6">
                   {subsAnalysis?.detectedSubscriptions?.slice(0, 3).map((sub: any, i: number) => (
                      <div key={i} className="flex justify-between items-center group/item cursor-pointer">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover/item:bg-primary/20 transition-colors">
                               <CreditCard className="h-4 w-4 text-white/40 group-hover/item:text-primary" />
                            </div>
                            <div>
                               <p className="font-black text-sm">{sub.name}</p>
                               <p className="text-[9px] text-white/20 font-black uppercase tracking-widest">{sub.cycle} Renewal</p>
                            </div>
                         </div>
                         <p className="font-black italic text-lg tracking-tighter">₹{sub.amount}</p>
                      </div>
                   ))}
                   {(!subsAnalysis || subsAnalysis.detectedSubscriptions.length === 0) && (
                      <div className="text-center py-10 opacity-10 flex flex-col items-center gap-4">
                         <LayoutGrid className="h-10 w-10" />
                         <p className="text-[9px] font-black uppercase tracking-widest">No recurring leaks found</p>
                      </div>
                   )}
                </div>
              </div>
              <Button asChild className="w-full h-16 rounded-[2rem] bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all font-black text-[10px] uppercase tracking-[0.2em] border border-primary/20">
                 <Link href="/subscriptions">Manage All Leaks</Link>
              </Button>
           </Card>

           <div className="lg:col-span-2 space-y-8">
              <div className="flex justify-between items-end">
                 <div>
                   <h2 className="text-2xl font-black italic tracking-tighter flex items-center gap-4">
                      <History className="h-6 w-6 text-primary" /> Manifested Reality
                   </h2>
                   <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 mt-2">Latest Matrix Log Entries</p>
                 </div>
                 <Link href="/transactions" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors border-b border-primary/20 pb-1">Full Universal History</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <AnimatePresence>
                   {transactions?.slice(0, 6).map((tx: any, i: number) => (
                      <motion.div 
                       key={tx.id} 
                       initial={{ opacity: 0, x: -20 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: i * 0.05 }}
                       className="flex items-center justify-between p-8 glass-dark rounded-[2.5rem] border border-white/[0.03] hover:bg-white/[0.06] transition-all group"
                      >
                         <div className="flex items-center gap-6">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 transition-transform group-hover:scale-110", 
                              tx.type === 'income' ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"
                            )}>
                               {tx.type === 'income' ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
                            </div>
                            <div>
                               <p className="font-black text-lg">{tx.merchant || tx.category}</p>
                               <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">{format(tx.date?.seconds ? new Date(tx.date.seconds * 1000) : new Date(), 'MMMM dd, yyyy')}</p>
                            </div>
                         </div>
                         <div className="text-right">
                           <p className={cn("text-xl font-black italic tracking-tighter", tx.type === 'income' ? "text-emerald-400" : "text-white")}>
                             {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                           </p>
                           <p className="text-[8px] font-black uppercase text-white/10 tracking-[0.3em] mt-1">{tx.category}</p>
                         </div>
                      </motion.div>
                   ))}
                 </AnimatePresence>
              </div>
           </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
