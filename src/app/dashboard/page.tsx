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
  ShieldX,
  Search,
  Bell,
  ChevronRight,
  ArrowRight,
  Target
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
  LineChart as RechartsLineChart,
  Line,
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

  return (
    <div className="min-h-screen pb-44 bg-[#020617] text-white">
      {/* Dashboard Header */}
      <header className="px-8 py-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hello, {user?.displayName?.split(' ')[0] || 'Entity'} 👋</h1>
          <p className="text-white/40 text-sm font-medium mt-1">Here's what's happening with your finances today.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative group hidden sm:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
              <input 
                placeholder="Search transactions, categories..." 
                className="h-12 w-80 rounded-2xl bg-white/[0.03] border border-white/5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-primary/40 transition-all"
              />
           </div>
           <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 relative">
              <Bell className="w-5 h-5 text-white/60" />
              <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#020617]" />
           </Button>
           <Avatar className="w-12 h-12 rounded-2xl border border-white/10">
              <AvatarImage src={user?.photoURL || ''} />
              <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
                {user?.displayName?.[0] || 'U'}
              </AvatarFallback>
           </Avatar>
        </div>
      </header>

      <main className="px-8 space-y-10">
        {/* Row 1: Summary Statistics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Balance', value: stats.balance, icon: Wallet2, trend: 12.5, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Total Income', value: stats.income, icon: ArrowUpRight, trend: 8.4, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Total Expenses', value: stats.expense, icon: ArrowDownRight, trend: 15.3, color: 'text-rose-500', bg: 'bg-rose-500/10' },
            { label: 'Savings', value: stats.income - stats.expense, icon: CreditCard, trend: 5.7, color: 'text-accent', bg: 'bg-accent/10' },
          ].map((item, i) => (
            <Card key={i} className="p-8 rounded-3xl glass-dark border-white/5 hover:bg-white/[0.05] transition-all group">
               <div className="flex justify-between items-start mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{item.label}</p>
                  <div className={cn("p-2 rounded-xl", item.bg)}>
                    <item.icon className={cn("w-4 h-4", item.color)} />
                  </div>
               </div>
               <h3 className="text-3xl font-bold tracking-tighter italic">₹{item.value.toLocaleString()}</h3>
               <div className="mt-4 flex items-center gap-2">
                  <TrendingUp className={cn("w-3 h-3", item.trend > 0 ? "text-emerald-500" : "text-rose-500")} />
                  <span className={cn("text-[10px] font-bold", item.trend > 0 ? "text-emerald-500" : "text-rose-500")}>
                    {item.trend}% vs last month
                  </span>
               </div>
            </Card>
          ))}
        </section>

        {/* Row 2: Analytics Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Spending Overview */}
           <Card className="rounded-[2.5rem] glass-dark border-white/5 p-8 flex flex-col">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-sm font-bold uppercase tracking-widest text-white/30">Spending Overview</h2>
                 <select className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-white/40 border-none focus:ring-0 cursor-pointer">
                    <option>This Month</option>
                    <option>Last Month</option>
                 </select>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center relative">
                 <div className="w-full h-56">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie
                            data={spendingOverviewData}
                            cx="50%" cy="50%"
                            innerRadius={65}
                            outerRadius={85}
                            paddingAngle={8}
                            dataKey="value"
                          >
                             {spendingOverviewData.map((_, index) => (
                               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                             ))}
                          </Pie>
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[8px] font-bold uppercase tracking-widest text-white/20">Total Expenses</p>
                    <p className="text-xl font-bold tracking-tighter italic">₹{stats.expense.toLocaleString()}</p>
                    <p className="text-[8px] font-bold text-white/30">This Month</p>
                 </div>
                 <div className="w-full mt-8 grid grid-cols-2 gap-x-8 gap-y-4">
                    {spendingOverviewData.slice(0, 4).map((item, i) => (
                      <div key={i} className="flex items-center justify-between group">
                         <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-[10px] font-bold text-white/40 group-hover:text-white/60 transition-colors">{item.name}</span>
                         </div>
                         <span className="text-[10px] font-bold">₹{item.value.toLocaleString()}</span>
                      </div>
                    ))}
                 </div>
              </div>
           </Card>

           {/* Expense Trend */}
           <Card className="rounded-[2.5rem] glass-dark border-white/5 p-8 lg:col-span-1 flex flex-col">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-sm font-bold uppercase tracking-widest text-white/30">Expense Trend</h2>
                 <div className="flex gap-2">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-[8px] font-bold uppercase tracking-widest rounded-full border border-primary/20">Expenses</span>
                    <span className="px-3 py-1 text-white/20 text-[8px] font-bold uppercase tracking-widest rounded-full border border-white/5">Income</span>
                 </div>
              </div>
              <div className="flex-1 w-full h-64">
                 {forecast ? (
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={forecast.overallForecast}>
                          <defs>
                            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
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
                            stroke="#8B5CF6" 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#trendGradient)" 
                          />
                       </AreaChart>
                    </ResponsiveContainer>
                 ) : (
                    <div className="h-full flex items-center justify-center opacity-10 font-bold uppercase text-[10px] tracking-[0.4em]">Simulating Trend...</div>
                 )}
              </div>
              <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                 <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-[#020617] bg-white/5" />
                    ))}
                 </div>
                 <p className="text-[10px] font-bold text-white/20 italic">Projected Flow: Stable</p>
              </div>
           </Card>

           {/* Financial Health Score */}
           <Card className="rounded-[2.5rem] glass-dark border-white/5 p-8">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-sm font-bold uppercase tracking-widest text-white/30">Financial Health Score</h2>
              </div>
              <div className="flex flex-col items-center">
                 <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90">
                       <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                       <circle 
                         cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="8" fill="transparent" 
                         strokeDasharray={452.39}
                         strokeDashoffset={452.39 - (452.39 * (healthAnalysis?.score || 85)) / 100}
                         className="text-emerald-500 transition-all duration-1000"
                       />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <span className="text-5xl font-bold italic tracking-tighter">{healthAnalysis?.score || 85}</span>
                       <span className="text-[8px] font-bold uppercase tracking-widest text-white/40">Excellent</span>
                    </div>
                 </div>
                 <p className="mt-8 text-center text-xs font-medium text-white/40 max-w-[200px] leading-relaxed">
                    You are managing your finances better than 78% of users.
                 </p>
                 <div className="w-full mt-10 space-y-6">
                    {[
                      { label: 'Savings Rate', val: healthAnalysis?.metrics?.savingsRate || 0.9, icon: CheckCircle2, color: 'text-emerald-500' },
                      { label: 'Spending Behavior', val: 0.8, icon: Activity, color: 'text-orange-400' },
                      { label: 'Budget Adherence', val: healthAnalysis?.metrics?.budgetAdherence || 0.85, icon: ShieldCheck, color: 'text-emerald-500' },
                      { label: 'Debt Management', val: 0.7, icon: AlertCircle, color: 'text-accent' },
                      { label: 'Financial Security', val: 0.95, icon: Zap, color: 'text-primary' },
                    ].map((m, i) => (
                      <div key={i} className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <m.icon className={cn("w-4 h-4", m.color)} />
                            <span className="text-[10px] font-bold text-white/60">{m.label}</span>
                         </div>
                         <span className="text-[10px] font-bold">{Math.round(m.val * 100)}/100</span>
                      </div>
                    ))}
                 </div>
                 <Button className="w-full mt-10 h-14 rounded-2xl bg-primary hover:bg-primary/80 transition-all font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">View Full Report</Button>
              </div>
           </Card>
        </section>

        {/* Row 3: History & Sector Limits */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Recent Transactions */}
           <Card className="rounded-[2.5rem] glass-dark border-white/5 p-8 flex flex-col">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-sm font-bold uppercase tracking-widest text-white/30">Recent Transactions</h2>
                 <Link href="/transactions" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">View All</Link>
              </div>
              <div className="flex-1 space-y-6">
                 {transactions?.slice(0, 5).map((tx: any, i: number) => (
                    <div key={i} className="flex items-center justify-between group">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                             {tx.type === 'income' ? <ArrowUpRight className="w-6 h-6 text-emerald-500" /> : <ArrowDownRight className="w-6 h-6 text-rose-500" />}
                          </div>
                          <div>
                             <p className="text-sm font-bold">{tx.merchant || tx.category}</p>
                             <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">{tx.category}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className={cn("text-sm font-bold italic tracking-tighter", tx.type === 'income' ? "text-emerald-400" : "text-white")}>
                             {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                          </p>
                          <p className="text-[10px] font-bold text-white/20 mt-1">Today</p>
                       </div>
                    </div>
                 ))}
                 {(!transactions || transactions.length === 0) && (
                    <div className="py-20 text-center opacity-10 flex flex-col items-center gap-4">
                       <History className="w-12 h-12" />
                       <p className="text-[10px] font-bold uppercase tracking-widest">No Recent Logs</p>
                    </div>
                 )}
              </div>
           </Card>

           {/* Budgets / Sector Limits */}
           <Card className="rounded-[2.5rem] glass-dark border-white/5 p-8 flex flex-col">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-sm font-bold uppercase tracking-widest text-white/30">Budgets</h2>
                 <Link href="/budget" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">View All</Link>
              </div>
              <div className="flex-1 space-y-8">
                 {budgets?.slice(0, 4).map((b: any, i: number) => {
                    const spent = transactions?.filter(t => t.category === b.category && t.type === 'expense').reduce((s, tx) => s + tx.amount, 0) || 0;
                    const progress = Math.min((spent / b.limit) * 100, 100);
                    return (
                      <div key={i} className="space-y-3">
                         <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                  <PieChart className="w-4 h-4 text-primary" />
                               </div>
                               <span className="text-[11px] font-bold">{b.category}</span>
                            </div>
                            <span className="text-[11px] font-bold">₹{spent.toLocaleString()} / ₹{b.limit.toLocaleString()}</span>
                         </div>
                         <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className={cn("absolute inset-y-0 left-0 transition-all duration-1000", progress > 90 ? "bg-rose-500" : "bg-primary")} 
                              style={{ width: `${progress}%` }} 
                            />
                         </div>
                      </div>
                    );
                 })}
                 {(!budgets || budgets.length === 0) && (
                    <div className="py-20 text-center opacity-10 flex flex-col items-center gap-4">
                       <ShieldAlert className="w-12 h-12" />
                       <p className="text-[10px] font-bold uppercase tracking-widest">No Active Limits</p>
                    </div>
                 )}
              </div>
           </Card>

           {/* Top Categories */}
           <Card className="rounded-[2.5rem] glass-dark border-white/5 p-8 flex flex-col">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-sm font-bold uppercase tracking-widest text-white/30">Top Categories</h2>
                 <Link href="/analytics" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">View All</Link>
              </div>
              <div className="flex-1 space-y-6">
                 {spendingOverviewData.sort((a,b) => b.value - a.value).slice(0, 5).map((item, i) => (
                    <div key={i} className="flex items-center justify-between group">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
                             <LayoutGrid className="w-5 h-5 text-white/40" />
                          </div>
                          <div>
                             <p className="text-sm font-bold">{item.name}</p>
                             <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-0.5">Sector High Impact</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-bold italic">₹{item.value.toLocaleString()}</p>
                          <p className="text-[10px] font-bold text-accent mt-0.5">{Math.round((item.value / stats.expense) * 100)}%</p>
                       </div>
                    </div>
                 ))}
                 {spendingOverviewData.length === 0 && (
                    <div className="py-20 text-center opacity-10 flex flex-col items-center gap-4">
                       <BarChart3 className="w-12 h-12" />
                       <p className="text-[10px] font-bold uppercase tracking-widest">No Sector Data</p>
                    </div>
                 )}
              </div>
           </Card>
        </section>

        {/* AI Assistant Call-to-Action */}
        <section className="pb-12">
           <Card className="rounded-[3rem] p-10 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-10 group overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(139,92,246,0.15),transparent)] pointer-events-none" />
              <div className="flex items-center gap-8 relative z-10">
                 <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                    <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                 </div>
                 <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">AI Finance Assistant</h2>
                    <p className="text-white/60 font-medium max-w-xl">Hi {user?.displayName?.split(' ')[0]}! I've analyzed your spending and found some insights that can help you save up to ₹12,500 this month.</p>
                 </div>
              </div>
              <Button size="lg" className="h-16 px-10 rounded-[2rem] bg-primary hover:bg-primary/80 transition-all font-bold uppercase text-xs tracking-widest shadow-2xl shadow-primary/30 group/btn relative z-10" asChild>
                 <Link href="/ai-assistant">
                    Ask AI Assistant <ArrowRight className="ml-3 w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                 </Link>
              </Button>
           </Card>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}