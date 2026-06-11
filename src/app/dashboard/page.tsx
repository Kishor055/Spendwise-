"use client";

import { useMemo, useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Loader2, 
  Plus, 
  TrendingUp, 
  Sparkles,
  Activity,
  BrainCircuit,
  Bell,
  Target,
  Trophy,
  Wallet2,
  TrendingDown,
  CircleDollarSign,
  Flame,
  ShieldCheck,
  LayoutGrid,
  Zap,
  Clock,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { getBalanceForecast } from '@/ai/flows/predictive-forecast-flow';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from 'next/link';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import { motion } from 'framer-motion';

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: any;
  note?: string;
}

const PIE_COLORS = ['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [forecast, setForecast] = useState<any>(null);
  const [isForecasting, setIsForecasting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'transactions'),
      orderBy('date', 'desc'),
      limit(50)
    );
  }, [firestore, user]);

  const remindersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'reminders'), limit(10));
  }, [firestore, user]);

  const budgetsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'budgets'));
  }, [firestore, user]);

  const { data: transactions, isLoading: isTransactionsLoading } = useCollection<Transaction>(transactionsQuery);
  const { data: reminders } = useCollection(remindersQuery);
  const { data: budgets } = useCollection(budgetsQuery);

  const stats = useMemo(() => {
    if (!transactions) return { balance: 0, income: 0, expense: 0, savings: 0, healthScore: 0, monthlyBudget: 50000 };
    
    const totals = transactions.reduce((acc, tx) => {
      if (tx.type === 'income') {
        acc.income += tx.amount;
        acc.balance += tx.amount;
      } else {
        acc.expense += tx.amount;
        acc.balance -= tx.amount;
      }
      return acc;
    }, { balance: 0, income: 0, expense: 0 });

    const savings = Math.max(0, totals.income - totals.expense);
    const savingsRate = totals.income > 0 ? (savings / totals.income) * 100 : 0;
    
    // Comprehensive Health Score Logic
    const budgetAdherence = budgets && budgets.length > 0 
      ? 100 - (budgets.filter(b => (transactions.filter(t => t.category === b.category && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)) > b.limit).length / budgets.length) * 100
      : 100;

    const healthScore = Math.round((savingsRate * 0.6) + (budgetAdherence * 0.4));

    return { ...totals, savings, healthScore, monthlyBudget: 50000 };
  }, [transactions, budgets]);

  useEffect(() => {
    async function runForecast() {
      if (!transactions || transactions.length < 5 || isForecasting) return;
      setIsForecasting(true);
      try {
        const result = await getBalanceForecast({
          currentBalance: stats.balance,
          transactions: transactions.map(t => ({
            amount: t.amount,
            type: t.type,
            date: t.date?.seconds ? new Date(t.date.seconds * 1000).toISOString() : new Date().toISOString()
          })),
          reminders: (reminders || []).map(r => ({
            amount: r.amount,
            dueDate: r.dueDate
          }))
        });
        setForecast(result);
      } catch (e) {
        console.error("Forecasting Error:", e);
      } finally {
        setIsForecasting(false);
      }
    }
    if (mounted && transactions && transactions.length > 5) {
      runForecast();
    }
  }, [mounted, transactions, reminders, stats.balance]);

  const categoryData = useMemo(() => {
    if (!transactions) return [];
    const cats: Record<string, number> = {};
    const totalExpense = stats.expense || 1;
    transactions.filter(t => t.type === 'expense').forEach(t => {
      cats[t.category] = (cats[t.category] || 0) + t.amount;
    });
    return Object.entries(cats).map(([name, value]) => ({ 
      name, 
      value,
      percent: Math.round((value / totalExpense) * 100)
    })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [transactions, stats.expense]);

  if (!mounted || isUserLoading || (isTransactionsLoading && !transactions)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#020617]">
        <Loader2 className="h-12 w-12 text-primary animate-spin opacity-50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-44 text-white bg-[#020617] selection:bg-primary/30">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[60%] bg-primary/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-accent/5 blur-[120px] rounded-full" />
      </div>

      <header className="px-8 py-10 sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-3xl border-b border-white/[0.05]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-tr from-primary to-accent p-[1px] shadow-2xl">
              <div className="w-full h-full bg-[#020617] rounded-[1.5rem] flex items-center justify-center">
                <BrainCircuit className="w-7 h-7 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight leading-none italic">SpendWise 3.0</h1>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.4em] mt-2">Quantum Neural Terminal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                <Flame className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Streak: 12d</span>
             </div>
             <Button variant="ghost" size="icon" className="rounded-2xl glass h-12 w-12" asChild>
                <Link href="/profile"><ShieldCheck className="h-6 w-6 text-emerald-400" /></Link>
             </Button>
          </div>
        </div>
      </header>

      <main className="px-8 py-12 space-y-10 max-w-7xl mx-auto relative z-10">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
           {[
             { label: 'Sector Control', icon: LayoutGrid, href: '/budget', color: 'text-primary' },
             { label: 'Time Alerts', icon: Bell, href: '/reminders', color: 'text-accent' },
             { label: 'Strategic Goals', icon: Target, href: '/goals', color: 'text-emerald-400' },
             { label: 'Recap Matrix', icon: Trophy, href: '/wrapped', color: 'text-yellow-400' }
           ].map((item, i) => (
             <Link key={item.label} href={item.href}>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-dark p-6 rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center text-center space-y-4 group hover:bg-white/[0.05] transition-all"
                >
                   <div className={cn("p-4 rounded-2xl bg-white/[0.03] border border-white/5 group-hover:scale-110 transition-transform", item.color)}>
                      <item.icon className="h-7 w-7" />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{item.label}</p>
                </motion.div>
             </Link>
           ))}
        </section>

        {/* Predictive Section */}
        <section>
          <Card className="rounded-[3rem] border-none glass-dark p-10 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-10 opacity-5">
                <Zap className="h-32 w-32 animate-pulse" />
             </div>
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                   <div>
                      <h2 className="text-xl font-black italic tracking-tighter flex items-center gap-3 text-glow">
                         <TrendingUp className="h-5 w-5 text-accent" />
                         Predictive Cash Flow
                      </h2>
                      <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.4em] mt-1">AI-Powered Temporal Projection</p>
                   </div>
                   {isForecasting && <Loader2 className="h-5 w-5 animate-spin text-accent" />}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                   <div className="lg:col-span-2 h-[220px] w-full">
                      {forecast ? (
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={forecast.forecast}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.03} />
                               <XAxis dataKey="days" tickFormatter={(v) => `${v}d`} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: 'rgba(255,255,255,0.2)' }} />
                               <YAxis hide />
                               <Tooltip 
                                  contentStyle={{ background: '#0a0a16', border: 'none', borderRadius: '1rem', fontSize: '10px', fontWeight: '900' }}
                                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                               <Bar dataKey="predictedBalance" radius={[10, 10, 0, 0]}>
                                  {forecast.forecast.map((entry: any, index: number) => (
                                     <Cell key={`cell-${index}`} fill={entry.riskLevel === 'HIGH' ? '#ef4444' : entry.riskLevel === 'MEDIUM' ? '#f59e0b' : '#10b981'} />
                                  ))}
                               </Bar>
                            </BarChart>
                         </ResponsiveContainer>
                      ) : (
                         <div className="h-full flex items-center justify-center bg-white/[0.02] rounded-[2rem] border border-dashed border-white/5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/10">Synchronizing temporal vectors...</p>
                         </div>
                      )}
                   </div>
                   <div className="flex flex-col justify-center space-y-6">
                      {forecast ? (
                         <>
                            <div className="p-6 bg-white/[0.03] rounded-[2.5rem] border border-white/5">
                               <p className="text-[8px] font-black uppercase tracking-[0.3em] text-accent mb-3">Intelligence Insight</p>
                               <p className="text-sm font-bold leading-relaxed text-white/80 italic">"{forecast.insight}"</p>
                            </div>
                            <div className="flex items-center gap-4 px-4">
                               <div className={cn(
                                  "w-3 h-3 rounded-full animate-pulse",
                                  forecast.forecast[0].riskLevel === 'HIGH' ? "bg-rose-500" : "bg-emerald-500 shadow-[0_0_10px_#10b981]"
                               )} />
                               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Risk Status: {forecast.forecast[0].riskLevel}</span>
                            </div>
                         </>
                      ) : (
                         <div className="space-y-4 animate-pulse">
                            <div className="h-10 bg-white/5 rounded-xl w-full" />
                            <div className="h-24 bg-white/5 rounded-2xl w-full" />
                         </div>
                      )}
                   </div>
                </div>
             </div>
          </Card>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: 'Available Liquidity', value: stats.balance, icon: Wallet2, color: 'text-primary' },
            { label: 'Matrix Inflow', value: stats.income, icon: TrendingUp, color: 'text-emerald-400' },
            { label: 'Resource Outflow', value: stats.expense, icon: TrendingDown, color: 'text-rose-400' },
            { label: 'Strategic Reserve', value: stats.savings, icon: CircleDollarSign, color: 'text-accent' },
          ].map((item, i) => (
            <motion.div 
              key={item.label} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + (i * 0.1) }}
            >
              <Card className="rounded-[3rem] border-none glass-dark p-8 group hover:bg-white/[0.05] transition-all">
                <div className="flex justify-between items-start mb-6">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">{item.label}</p>
                  <div className={cn("p-3 rounded-2xl bg-white/[0.03] border border-white/5 group-hover:scale-110 transition-transform", item.color)}>
                    <item.icon className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-3xl font-black tabular-nums tracking-tighter italic">₹{item.value.toLocaleString('en-IN')}</h3>
              </Card>
            </motion.div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="rounded-[3rem] border-none glass-dark p-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <LayoutGrid className="h-10 w-10 text-primary" />
             </div>
             <CardHeader className="p-0 mb-8">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Sector Utilization</CardTitle>
             </CardHeader>
             <div className="space-y-6">
                {categoryData.length > 0 ? categoryData.map((item, i) => (
                   <div key={item.name} className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-1">
                         <span>{item.name}</span>
                         <span className="text-white/40 italic">₹{item.value.toLocaleString()} ({item.percent}%)</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden">
                         <div 
                            className="h-full bg-primary rounded-full transition-all duration-1000" 
                            style={{ width: `${item.percent}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} 
                         />
                      </div>
                   </div>
                )) : (
                   <div className="h-40 flex items-center justify-center opacity-10">
                      <p className="text-[10px] font-black uppercase tracking-widest">No sector data</p>
                   </div>
                )}
             </div>
          </Card>

          <Card className="rounded-[3rem] border-none glass-dark p-8 flex flex-col items-center justify-center">
             <div className="relative w-56 h-56 mb-8">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                   <circle className="text-white/[0.03]" strokeWidth="8" stroke="currentColor" fill="transparent" r="42" cx="50" cy="50" />
                   <circle 
                      className="text-accent accent-glow transition-all duration-[2000ms] ease-out" 
                      strokeWidth="8" 
                      strokeDasharray={264} 
                      strokeDashoffset={264 - (264 * stats.healthScore) / 100} 
                      strokeLinecap="round" 
                      stroke="currentColor" 
                      fill="transparent" 
                      r="42" 
                      cx="50" 
                      cy="50" 
                   />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-6xl font-black italic tracking-tighter accent-glow">{stats.healthScore}</span>
                  <span className="text-[10px] font-black text-accent uppercase tracking-[0.4em] mt-2">Vitality Index</span>
                </div>
             </div>
             <div className="text-center space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                   {stats.healthScore > 70 ? 'Superior Standing' : stats.healthScore > 40 ? 'Stable Matrix' : 'Critical Correction'}
                </p>
                <p className="text-xs font-bold text-white/30">Based on savings efficiency & budget protocols</p>
             </div>
          </Card>

          <Card className="rounded-[3rem] border-none glass-dark p-8">
            <CardHeader className="p-0 mb-8 flex justify-between items-center">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Recent Manifestations</CardTitle>
              <Button variant="ghost" size="sm" asChild className="h-8 text-[9px] font-black uppercase tracking-widest text-white/20">
                <Link href="/transactions">History</Link>
              </Button>
            </CardHeader>
            <div className="space-y-4">
              {transactions?.slice(0, 4).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                  <div className="flex items-center gap-4">
                     <div className={cn(
                       "w-10 h-10 rounded-xl flex items-center justify-center border border-white/5",
                       tx.type === 'income' ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                     )}>
                        {tx.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                     </div>
                     <div>
                        <p className="text-sm font-black tracking-tight">{tx.category}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/20">{format(tx.date?.seconds ? new Date(tx.date.seconds * 1000) : new Date(), 'MMM dd')}</p>
                     </div>
                  </div>
                  <p className={cn("text-sm font-black italic", tx.type === 'income' ? "text-accent" : "text-white")}>
                     {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                  </p>
                </div>
              ))}
              {(!transactions || transactions.length === 0) && (
                <div className="h-40 flex flex-col items-center justify-center opacity-10">
                   <Clock className="h-8 w-8 mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Logs</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
