
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
  Activity,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Search,
  Bell,
  ChevronRight,
  ArrowRight,
  Target,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getBalanceForecast } from '@/ai/flows/predictive-forecast-flow';
import { analyzeSubscriptions } from '@/ai/flows/subscription-analyzer-flow';
import { getFinancialHealthScore } from '@/ai/flows/financial-health-flow';
import { detectAnomalies } from '@/ai/flows/anomaly-detection-flow';
import Link from 'next/link';
import { 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  BarChart, 
  Bar,
  Cell,
  AreaChart,
  Area,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

const COLORS = ['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#6366F1'];

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [forecast, setForecast] = useState<any>(null);
  const [subsAnalysis, setSubsAnalysis] = useState<any>(null);
  const [healthAnalysis, setHealthAnalysis] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any>(null);
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

  const goalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'goals'));
  }, [firestore, user]);

  const { data: transactions, isLoading: isTransactionsLoading } = useCollection(transactionsQuery);
  const { data: budgets } = useCollection(budgetsQuery);
  const { data: reminders } = useCollection(remindersQuery);
  const { data: goals } = useCollection(goalsQuery);

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

  const spendingOverviewData = useMemo(() => {
    if (!transactions) return [];
    const cats: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      cats[t.category] = (cats[t.category] || 0) + t.amount;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  useEffect(() => {
    async function runIntelligence() {
      if (!transactions || transactions.length < 5 || isIntelligenceRunning) return;
      setIsIntelligenceRunning(true);
      try {
        const currentBalance = stats.balance;
        const totalEmergencyFund = (goals || [])
          .filter(g => g.title.toLowerCase().includes('emergency'))
          .reduce((sum, g) => sum + g.currentAmount, 0) + currentBalance;

        const [f, s, h, a] = await Promise.all([
          getBalanceForecast({
            currentBalance,
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
          }),
          getFinancialHealthScore({
            income: stats.income || 50000,
            expenses: stats.expense,
            budgets: (budgets || []).map(b => ({
              category: b.category,
              limit: b.limit,
              spent: transactions.filter(t => t.category === b.category && t.type === 'expense').reduce((s, tx) => s + tx.amount, 0)
            })),
            emergencyFund: totalEmergencyFund,
            totalDebt: 0
          }),
          detectAnomalies({
            transactions: transactions.map(t => ({
              id: t.id,
              amount: t.amount,
              merchant: t.merchant || t.category,
              category: t.category,
              date: t.date?.seconds ? new Date(t.date.seconds * 1000).toISOString() : new Date().toISOString()
            })),
            typicalDailySpend: (stats.expense / 30) || 1000
          })
        ]);
        setForecast(f);
        setSubsAnalysis(s);
        setHealthAnalysis(h);
        setAnomalies(a);
      } catch (e) {
        console.error('Intelligence Error:', e);
      } finally {
        setIsIntelligenceRunning(false);
      }
    }
    if (mounted && transactions && transactions.length > 5) runIntelligence();
  }, [mounted, transactions, stats.balance, reminders, budgets, goals]);

  if (!mounted || isUserLoading || (isTransactionsLoading && !transactions)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#020617]">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  const insights = [
    { text: "Travel spending is up 12% this week.", type: 'warning' },
    { text: "You saved ₹4,200 more than last month.", type: 'success' },
    { text: "Subscription leak detected: Netflix renewal soon.", type: 'info' },
    { text: "Goal 'New Car' is 45% optimized.", type: 'success' }
  ];

  return (
    <div className="min-h-screen pb-44 bg-[#020617] text-white">
      {/* Dynamic Intelligence Ticker */}
      <div className="w-full h-10 bg-primary/10 border-b border-primary/20 flex items-center overflow-hidden">
        <div className="flex items-center gap-4 px-8 whitespace-nowrap animate-marquee">
           {insights.map((insight, i) => (
             <div key={i} className="flex items-center gap-3">
               <div className={cn(
                 "h-1.5 w-1.5 rounded-full",
                 insight.type === 'warning' ? "bg-rose-500" : insight.type === 'success' ? "bg-emerald-500" : "bg-accent"
               )} />
               <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{insight.text}</span>
               <span className="text-white/10 mx-4">|</span>
             </div>
           ))}
           {/* Duplicate for seamless scroll */}
           {insights.map((insight, i) => (
             <div key={`dup-${i}`} className="flex items-center gap-3">
               <div className={cn(
                 "h-1.5 w-1.5 rounded-full",
                 insight.type === 'warning' ? "bg-rose-500" : insight.type === 'success' ? "bg-emerald-500" : "bg-accent"
               )} />
               <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{insight.text}</span>
               <span className="text-white/10 mx-4">|</span>
             </div>
           ))}
        </div>
      </div>

      <header className="px-8 py-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter italic">Greetings, {user?.displayName?.split(' ')[0] || 'Entity'}</h1>
          <p className="text-white/30 text-sm font-bold mt-1 uppercase tracking-widest">Neural Link Status: Active</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative group hidden sm:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
              <input 
                placeholder="Query Matrix Logs..." 
                className="h-12 w-80 rounded-2xl bg-white/[0.03] border border-white/5 pl-12 pr-4 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-primary/40 transition-all placeholder:text-white/10"
              />
           </div>
           <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 relative hover:bg-primary/20 hover:text-primary transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#020617]" />
           </Button>
           <Avatar className="w-12 h-12 rounded-2xl border border-white/10 shadow-2xl">
              <AvatarImage src={user?.photoURL || ''} />
              <AvatarFallback className="bg-primary/20 text-primary font-black text-sm italic">
                {user?.displayName?.[0] || 'U'}
              </AvatarFallback>
           </Avatar>
        </div>
      </header>

      <main className="px-8 space-y-10">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Universal Balance', value: stats.balance, icon: Wallet2, trend: 12.5, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Neural Inflow', value: stats.income, icon: ArrowUpRight, trend: 8.4, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Matrix Outflow', value: stats.expense, icon: ArrowDownRight, trend: 15.3, color: 'text-rose-500', bg: 'bg-rose-500/10' },
            { label: 'Retained Capital', value: stats.income - stats.expense, icon: CreditCard, trend: 5.7, color: 'text-accent', bg: 'bg-accent/10' },
          ].map((item, i) => (
            <Card key={i} className="p-8 rounded-[2.5rem] glass-dark border-white/5 hover:bg-white/[0.05] transition-all group relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                  <item.icon size={80} />
               </div>
               <div className="flex justify-between items-start mb-6">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">{item.label}</p>
                  <div className={cn("p-2.5 rounded-xl border border-white/5", item.bg)}>
                    <item.icon className={cn("w-4 h-4", item.color)} />
                  </div>
               </div>
               <h3 className="text-3xl font-black tracking-tighter italic">₹{item.value.toLocaleString()}</h3>
               <div className="mt-4 flex items-center gap-2">
                  <TrendingUp className={cn("w-3 h-3", item.trend > 0 ? "text-emerald-500" : "text-rose-500")} />
                  <span className={cn("text-[9px] font-black uppercase tracking-widest", item.trend > 0 ? "text-emerald-500" : "text-rose-500")}>
                    {item.trend}% Efficiency Variance
                  </span>
               </div>
            </Card>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Card className="rounded-[3.5rem] glass-dark border-white/5 p-10 flex flex-col relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 blur-[80px] rounded-full" />
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 flex items-center gap-3">
                    <Activity className="h-4 w-4 text-primary" />
                    Spending DNA
                 </h2>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center relative">
                 <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie
                            data={spendingOverviewData}
                            cx="50%" cy="50%"
                            innerRadius={75}
                            outerRadius={95}
                            paddingAngle={10}
                            dataKey="value"
                            stroke="none"
                          >
                             {spendingOverviewData.map((_, index) => (
                               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                             ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ background: '#0a0a16', border: 'none', borderRadius: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.8)', fontWeight: '900', fontSize: '10px' }}
                          />
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20">Burn Rate</p>
                    <p className="text-2xl font-black tracking-tighter italic">₹{stats.expense.toLocaleString()}</p>
                 </div>
                 <div className="w-full mt-10 grid grid-cols-2 gap-4">
                    {spendingOverviewData.slice(0, 4).map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-2xl border border-white/5">
                         <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                         <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase text-white/40 tracking-widest">{item.name}</span>
                            <span className="text-[11px] font-black italic">₹{item.value.toLocaleString()}</span>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </Card>

           <Card className="rounded-[3.5rem] glass-dark border-white/5 p-10 lg:col-span-1 flex flex-col relative overflow-hidden group">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 flex items-center gap-3">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    Evolution Trend
                 </h2>
              </div>
              <div className="flex-1 w-full h-72">
                 {forecast ? (
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={forecast.overallForecast}>
                          <defs>
                            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.03} />
                          <XAxis dataKey="days" hide />
                          <YAxis hide />
                          <Tooltip 
                            contentStyle={{ background: '#0a0a16', border: 'none', borderRadius: '1rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }} 
                            itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: '900' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="predictedBalance" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={4} 
                            fillOpacity={1} 
                            fill="url(#trendGradient)" 
                          />
                       </AreaChart>
                    </ResponsiveContainer>
                 ) : (
                    <div className="h-full flex items-center justify-center opacity-10 font-black uppercase text-[10px] tracking-[0.5em]">Synthesizing Waveforms...</div>
                 )}
              </div>
              <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[9px] font-black uppercase text-white/40 tracking-widest">Temporal Stability: High</p>
                 </div>
                 <Button variant="ghost" size="sm" className="h-8 rounded-full px-4 text-[8px] font-black uppercase tracking-widest border border-white/5" asChild>
                    <Link href="/analytics">Expand Vectors</Link>
                 </Button>
              </div>
           </Card>

           <Card className="rounded-[3.5rem] glass-dark border-white/5 p-10 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent)] pointer-events-none" />
              <div className="relative w-48 h-48">
                 <svg className="w-full h-full transform -rotate-90">
                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-white/5" />
                    <circle 
                      cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="10" fill="transparent" 
                      strokeDasharray={552.92}
                      strokeDashoffset={552.92 - (552.92 * (healthAnalysis?.score || 85)) / 100}
                      className="text-emerald-500 transition-all duration-[2000ms] ease-out"
                    />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-6xl font-black italic tracking-tighter text-glow">{healthAnalysis?.score || 85}</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mt-2">Vitality Index</span>
                 </div>
              </div>
              <div className="mt-12 space-y-6 w-full">
                 <p className="text-xs font-bold text-white/40 leading-relaxed italic max-w-[240px] mx-auto">
                    "Managing capital better than 78% of Elite-tier entities."
                 </p>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-white/[0.03] rounded-3xl border border-white/5">
                       <p className="text-[8px] font-black uppercase text-white/20 mb-1">Savings Rate</p>
                       <p className="text-sm font-black text-emerald-400">{(healthAnalysis?.metrics?.savingsRate * 100).toFixed(1)}%</p>
                    </div>
                    <div className="p-4 bg-white/[0.03] rounded-3xl border border-white/5">
                       <p className="text-[8px] font-black uppercase text-white/20 mb-1">Risk Profile</p>
                       <p className="text-sm font-black text-accent">Stable</p>
                    </div>
                 </div>
                 <Button className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/80 transition-all font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl shadow-primary/20">Request Full Audit</Button>
              </div>
           </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
           <Card className="rounded-[3.5rem] glass-dark border-white/5 p-10 flex flex-col relative overflow-hidden group">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Universal Logs</h2>
                 <Link href="/transactions" className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors">Audit Matrix</Link>
              </div>
              <div className="flex-1 space-y-6">
                 {transactions?.slice(0, 5).map((tx: any, i: number) => (
                    <div key={i} className="flex items-center justify-between group/item">
                       <div className="flex items-center gap-5">
                          <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center border border-white/5 group-hover/item:scale-110 transition-transform",
                            tx.type === 'income' ? "bg-emerald-500/10 text-emerald-500" : "bg-white/[0.03] text-white/40"
                          )}>
                             {tx.type === 'income' ? <ArrowUpRight className="w-7 h-7" /> : <ArrowDownRight className="w-7 h-7" />}
                          </div>
                          <div>
                             <p className="text-base font-black italic">{tx.merchant || tx.category}</p>
                             <p className="text-[9px] font-black uppercase text-white/20 tracking-widest mt-1">{tx.category}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className={cn("text-lg font-black italic tracking-tighter", tx.type === 'income' ? "text-emerald-400" : "text-white")}>
                             {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                          </p>
                       </div>
                    </div>
                 ))}
                 {(!transactions || transactions.length === 0) && (
                    <div className="py-24 text-center opacity-10 flex flex-col items-center gap-6">
                       <History className="h-20 w-20" />
                       <p className="text-[10px] font-black uppercase tracking-[0.5em]">No Temporal Logs</p>
                    </div>
                 )}
              </div>
           </Card>

           <Card className="rounded-[3.5rem] p-12 bg-gradient-to-br from-primary/10 to-accent/5 border border-white/5 col-span-1 lg:col-span-2 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(139,92,246,0.2),transparent)] pointer-events-none" />
              <div className="relative z-10 flex items-center gap-10">
                 <div className="w-24 h-24 rounded-3xl bg-primary/20 flex items-center justify-center shadow-3xl group-hover:scale-110 transition-transform duration-700">
                    <Sparkles className="w-12 h-12 text-primary animate-pulse" />
                 </div>
                 <div className="space-y-4">
                    <h2 className="text-4xl font-black italic tracking-tighter leading-none">Neural<br />Advisor v4.0</h2>
                    <p className="text-white/40 font-bold max-w-md leading-relaxed text-sm">Hi {user?.displayName?.split(' ')[0]}! I can simulate the impact of high-value purchases on your manifestation goals. Should you buy it today?</p>
                 </div>
              </div>
              <Button size="lg" className="h-20 px-12 rounded-[2rem] bg-primary hover:bg-primary/80 transition-all font-black uppercase text-[10px] tracking-[0.4em] shadow-3xl shadow-primary/40 group/btn relative z-10" asChild>
                 <Link href="/ai-assistant">
                    Query Terminal <ArrowRight className="ml-4 w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />
                 </Link>
              </Button>
           </Card>
        </section>
      </main>

      <BottomNav />

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
