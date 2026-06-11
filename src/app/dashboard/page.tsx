"use client";

import { useMemo, useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Loader2, 
  TrendingUp, 
  Sparkles,
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
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  History
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { getBalanceForecast } from '@/ai/flows/predictive-forecast-flow';
import { analyzeSubscriptions } from '@/ai/flows/subscription-analyzer-flow';
import Link from 'next/link';
import { 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  BarChart, 
  Bar,
  Cell
} from 'recharts';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [forecast, setForecast] = useState<any>(null);
  const [subsAnalysis, setSubsAnalysis] = useState<any>(null);
  const [isForecasting, setIsForecasting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc'), limit(50));
  }, [firestore, user]);

  const { data: transactions, isLoading: isTransactionsLoading } = useCollection(transactionsQuery);

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
      if (!transactions || transactions.length < 5 || isForecasting) return;
      setIsForecasting(true);
      try {
        const [f, s] = await Promise.all([
          getBalanceForecast({
            currentBalance: stats.balance,
            transactions: transactions.map(t => ({ amount: t.amount, type: t.type, date: t.date?.seconds ? new Date(t.date.seconds * 1000).toISOString() : new Date().toISOString() })),
            reminders: []
          }),
          analyzeSubscriptions({
            transactions: transactions.filter(t => t.type === 'expense').map(t => ({ merchant: t.merchant || t.category, category: t.category, amount: t.amount, date: t.date?.seconds ? new Date(t.date.seconds * 1000).toISOString() : new Date().toISOString() }))
          })
        ]);
        setForecast(f);
        setSubsAnalysis(s);
      } catch (e) {
        console.error(e);
      } finally {
        setIsForecasting(false);
      }
    }
    if (mounted && transactions && transactions.length > 5) runIntelligence();
  }, [mounted, transactions, stats.balance]);

  if (!mounted || isUserLoading || (isTransactionsLoading && !transactions)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#020617]">
        <Loader2 className="h-12 w-12 text-primary animate-spin opacity-50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-44 text-white bg-[#020617]">
      <header className="px-8 py-10 sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-3xl border-b border-white/[0.05]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-2xl">
              <BrainCircuit className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black italic">SpendWise 3.0</h1>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.4em]">Neural Co-Pilot Active</p>
            </div>
          </div>
          <div className="flex gap-4">
             <Link href="/subscriptions" className="glass h-12 w-12 rounded-2xl flex items-center justify-center relative">
                <CreditCard className="h-5 w-5 text-accent" />
                {subsAnalysis?.detectedSubscriptions?.length > 0 && (
                   <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-pulse" />
                )}
             </Link>
             <Link href="/ai-assistant" className="bg-primary h-12 w-12 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
                <Sparkles className="h-5 w-5 text-white" />
             </Link>
          </div>
        </div>
      </header>

      <main className="px-8 py-12 space-y-10 max-w-7xl mx-auto relative z-10">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <Card className="rounded-[3rem] glass-dark border-none p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <Zap className="h-24 w-24 text-accent" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-accent mb-6 flex items-center gap-3">
                 <TrendingUp className="h-4 w-4" /> Predictive Forecast
              </h2>
              <div className="h-48 w-full">
                 {forecast ? (
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={forecast.forecast}>
                          <XAxis dataKey="days" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'white', opacity: 0.3 }} />
                          <Tooltip contentStyle={{ background: '#0a0a16', border: 'none', borderRadius: '1rem' }} />
                          <Bar dataKey="predictedBalance" radius={[8, 8, 0, 0]}>
                             {forecast.forecast.map((entry: any, i: number) => (
                                <Cell key={i} fill={entry.riskLevel === 'HIGH' ? '#ef4444' : '#10b981'} />
                             ))}
                          </Bar>
                       </BarChart>
                    </ResponsiveContainer>
                 ) : <div className="h-full flex items-center justify-center opacity-10">Neural sync...</div>}
              </div>
           </Card>

           <Card className="rounded-[3rem] glass-dark border-none p-8">
              <h2 className="text-xs font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-3">
                 <CreditCard className="h-4 w-4" /> Subscription Leaks
              </h2>
              <div className="space-y-4">
                 {subsAnalysis?.detectedSubscriptions?.slice(0, 3).map((sub: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                       <div>
                          <p className="font-bold">{sub.name}</p>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest">{sub.cycle} Renewal</p>
                       </div>
                       <p className="font-black italic">₹{sub.amount}</p>
                    </div>
                 ))}
                 {(!subsAnalysis || subsAnalysis.detectedSubscriptions.length === 0) && (
                    <div className="text-center py-8 opacity-20 text-[10px] font-black uppercase tracking-widest">No leaks detected</div>
                 )}
              </div>
           </Card>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Liquidity', value: stats.balance, icon: Wallet2, color: 'text-primary' },
            { label: 'Vitality Index', value: `${stats.healthScore}%`, icon: ShieldCheck, color: 'text-emerald-400' },
            { label: 'Outflow', value: stats.expense, icon: TrendingDown, color: 'text-rose-400' },
            { label: 'Reserve', value: stats.income - stats.expense, icon: CircleDollarSign, color: 'text-accent' },
          ].map((item, i) => (
            <Card key={i} className="rounded-[2.5rem] glass-dark border-none p-6">
              <p className="text-[8px] font-black uppercase text-white/30 tracking-widest mb-4">{item.label}</p>
              <h3 className="text-2xl font-black italic tracking-tighter">₹{item.value.toLocaleString()}</h3>
            </Card>
          ))}
        </section>

        <section className="space-y-6">
           <div className="flex justify-between items-center">
              <h2 className="text-xl font-black italic flex items-center gap-3">
                 <History className="h-5 w-5 text-primary" /> Recent Manifestations
              </h2>
              <Link href="/transactions" className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white">Full History</Link>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {transactions?.slice(0, 4).map((tx: any) => (
                 <div key={tx.id} className="flex items-center justify-between p-6 glass-dark rounded-[2rem] border border-white/5">
                    <div className="flex items-center gap-4">
                       <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border border-white/5", tx.type === 'income' ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary")}>
                          {tx.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                       </div>
                       <div>
                          <p className="font-bold">{tx.merchant || tx.category}</p>
                          <p className="text-[9px] text-white/20 font-black uppercase tracking-widest">{format(tx.date?.seconds ? new Date(tx.date.seconds * 1000) : new Date(), 'MMM dd')}</p>
                       </div>
                    </div>
                    <p className={cn("font-black italic", tx.type === 'income' ? "text-emerald-400" : "text-white")}>₹{tx.amount}</p>
                 </div>
              ))}
           </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
