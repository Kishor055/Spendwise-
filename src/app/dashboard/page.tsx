"use client";

import { useMemo, useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Loader2, 
  Plus, 
  TrendingUp, 
  Sparkles,
  Activity,
  Wallet,
  PieChart as PieChartIcon,
  CreditCard,
  BrainCircuit,
  Bell,
  Zap,
  Target,
  Trophy,
  Wallet2,
  TrendingDown,
  ChevronRight,
  CircleDollarSign,
  Flame,
  ShieldCheck,
  LayoutGrid
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TransactionForm } from '@/components/transactions/transaction-form';
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
  CartesianGrid
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  const { data: transactions, isLoading: isTransactionsLoading } = useCollection<Transaction>(transactionsQuery);

  const stats = useMemo(() => {
    if (!transactions) return { balance: 0, income: 0, expense: 0, savings: 0, healthScore: 0, budget: 50000 };
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
    const savingsRate = totals.income > 0 ? savings / totals.income : 0;
    const healthScore = Math.max(0, Math.min(100, Math.round(savingsRate * 100 + 40)));

    return { ...totals, savings, healthScore, budget: 50000 };
  }, [transactions]);

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

  const trendData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = format(d, 'd MMM');
      const dayTxs = transactions.filter(t => {
        const txDate = new Date(t.date?.seconds * 1000);
        return format(txDate, 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd');
      });
      return {
        name: dateStr,
        income: dayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        expense: dayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
      };
    });
  }, [transactions]);

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
              <h1 className="text-2xl font-black tracking-tight leading-none italic">Elite Matrix</h1>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.4em] mt-2">SpendWise Premium Active</p>
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
        {/* Quick Access Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
           {[
             { label: 'Sector Control', icon: LayoutGrid, href: '/budget', color: 'text-primary' },
             { label: 'Time Alerts', icon: Bell, href: '/reminders', color: 'text-accent' },
             { label: 'Strategic Goals', icon: Target, href: '/goals', color: 'text-emerald-400' },
             { label: 'Wrapped Hub', icon: Trophy, href: '/wrapped', color: 'text-yellow-400' }
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

        {/* Top Summary Row */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: 'Available Capital', value: stats.balance, icon: Wallet2, color: 'text-primary' },
            { label: 'Monthly Inflow', value: stats.income, icon: TrendingUp, color: 'text-emerald-400' },
            { label: 'Current Burn', value: stats.expense, icon: TrendingDown, color: 'text-rose-400' },
            { label: 'Reserve Power', value: stats.budget - stats.expense, icon: CircleDollarSign, color: 'text-accent' },
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

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Budget Progress Donut */}
          <Card className="rounded-[3rem] border-none glass-dark lg:col-span-1 p-8">
            <CardHeader className="p-0 mb-8 flex justify-between items-center">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Temporal Budget</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                 <Link href="/budget"><Plus className="h-4 w-4" /></Link>
              </Button>
            </CardHeader>
            <div className="flex flex-col items-center">
              <div className="relative w-full h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Consumed', value: stats.expense },
                        { name: 'Available', value: Math.max(0, stats.budget - stats.expense) }
                      ]}
                      innerRadius={80}
                      outerRadius={105}
                      paddingAngle={10}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#8B5CF6" />
                      <Cell fill="rgba(255,255,255,0.03)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black tracking-tighter italic">{Math.round((stats.expense / stats.budget) * 100)}%</span>
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mt-2">Consumed</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Sector Breakdown */}
          <Card className="rounded-[3rem] border-none glass-dark lg:col-span-1 p-8">
            <CardHeader className="p-0 mb-8 flex flex-row justify-between items-center">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Sector Power</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 text-[9px] font-black uppercase tracking-widest text-white/20" asChild>
                <Link href="/analytics">Expand</Link>
              </Button>
            </CardHeader>
            <div className="h-[240px] w-full mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', background: '#0a0a16', fontSize: '11px', fontWeight: '900' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Health Index */}
          <Card className="rounded-[3rem] border-none glass-dark lg:col-span-1 p-8">
            <CardHeader className="p-0 mb-10">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 flex justify-between items-center">
                Financial Vitality
                <Activity className="h-5 w-5 text-accent" />
              </CardTitle>
            </CardHeader>
            <div className="flex flex-col items-center justify-center text-center flex-1">
               <div className="relative w-48 h-48 mb-10">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                     <circle className="text-white/[0.03]" strokeWidth="8" stroke="currentColor" fill="transparent" r="42" cx="50" cy="50" />
                     <circle 
                        className="text-accent transition-all duration-[2000ms] ease-out shadow-accent" 
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
                    <span className="text-[10px] font-black text-accent uppercase tracking-[0.4em] mt-2">Optimal</span>
                  </div>
               </div>
            </div>
          </Card>
        </div>

        {/* Neural Insights & Actions */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-[3rem] border-none glass-dark p-8 overflow-hidden relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[80px] rounded-full" />
               <CardHeader className="p-0 mb-8 flex flex-row justify-between items-center">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 flex items-center gap-3">
                     Quantum Actions <Sparkles className="h-4 w-4 text-accent animate-pulse" />
                  </CardTitle>
               </CardHeader>
               <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex flex-col gap-3 h-28 rounded-[2rem] bg-primary shadow-2xl shadow-primary/20 hover:scale-105 transition-all">
                        <Plus className="h-7 w-7" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">New Log</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] glass rounded-[3rem] border-white/10 p-0 overflow-hidden">
                      <div className="p-10">
                        <DialogHeader className="mb-8">
                          <DialogTitle className="text-3xl font-black italic tracking-tighter">New Entry</DialogTitle>
                        </DialogHeader>
                        <TransactionForm onSuccess={() => setIsAddOpen(false)} />
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" className="flex flex-col gap-3 h-28 rounded-[2rem] glass border-white/10 hover:bg-white/10 hover:scale-105 transition-all" asChild>
                    <Link href="/budget">
                      <LayoutGrid className="h-7 w-7 text-accent" />
                      <span className="text-[8px] font-black uppercase tracking-[0.2em]">Budgets</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" className="flex flex-col gap-3 h-28 rounded-[2rem] glass border-white/10 hover:bg-white/10 hover:scale-105 transition-all" asChild>
                    <Link href="/reminders">
                      <Bell className="h-7 w-7 text-emerald-400" />
                      <span className="text-[8px] font-black uppercase tracking-[0.2em]">Alerts</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" className="flex flex-col gap-3 h-28 rounded-[2rem] glass border-white/10 hover:bg-white/10 hover:scale-105 transition-all" asChild>
                    <Link href="/ai-assistant">
                      <Sparkles className="h-7 w-7 text-primary" />
                      <span className="text-[8px] font-black uppercase tracking-[0.2em]">AI Advisor</span>
                    </Link>
                  </Button>
               </div>
            </Card>

            <Card className="rounded-[3rem] border-none glass-dark p-8">
              <CardHeader className="p-0 mb-8">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Universal Trends</CardTitle>
              </CardHeader>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={trendData}>
                      <defs>
                         <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                         </linearGradient>
                         <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                         </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.03} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: 'rgba(255,255,255,0.2)' }} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ background: '#0a0a16', border: 'none', borderRadius: '1.5rem', fontSize: '10px', fontWeight: '900' }} />
                      <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#colorInc)" />
                      <Area type="monotone" dataKey="expense" stroke="#8B5CF6" strokeWidth={4} fillOpacity={1} fill="url(#colorExp)" />
                   </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
