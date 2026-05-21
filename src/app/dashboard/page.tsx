
"use client";

import { useMemo, useState } from 'react';
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
  ChevronRight,
  Activity,
  Wallet,
  PieChart as PieChartIcon,
  CreditCard,
  Target,
  BrainCircuit,
  Bell,
  Search,
  Zap,
  LayoutGrid,
  Trophy
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
  LineChart,
  Line,
  XAxis
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

const PIE_COLORS = ['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B'];

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isAddOpen, setIsAddOpen] = useState(false);

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
    if (!transactions) return { balance: 0, income: 0, expense: 0, budget: 50000, healthScore: 0, savings: 0 };
    const totals = transactions.reduce((acc, tx) => {
      if (tx.type === 'income') {
        acc.income += tx.amount;
        acc.balance += tx.amount;
      } else {
        acc.expense += tx.amount;
        acc.balance -= tx.amount;
      }
      return acc;
    }, { balance: 0, income: 0, expense: 0, budget: 50000 });

    const savingsRate = totals.income > 0 ? (totals.income - totals.expense) / totals.income : 0;
    const healthScore = Math.max(0, Math.min(100, Math.round(savingsRate * 100 + 50)));
    const savings = Math.max(0, totals.income - totals.expense);

    return { ...totals, healthScore, savings };
  }, [transactions]);

  const categoryData = useMemo(() => {
    if (!transactions) return [];
    const cats: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      cats[t.category] = (cats[t.category] || 0) + t.amount;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value })).slice(0, 5);
  }, [transactions]);

  const trendData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    return transactions.slice(0, 10).map(t => ({
      date: format(new Date(t.date?.seconds * 1000 || Date.now()), 'MMM d'),
      amount: t.amount,
      type: t.type
    })).reverse();
  }, [transactions]);

  if (isUserLoading || (isTransactionsLoading && !transactions)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#020617]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-12 w-12 text-primary opacity-50" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-44 text-white bg-[#020617] overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[60%] bg-primary/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-accent/5 blur-[120px] rounded-full" />
      </div>

      <header className="px-6 py-8 flex justify-between items-center sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-3xl border-b border-white/[0.05]">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-accent p-[1.5px] shadow-2xl shadow-primary/30">
            <div className="w-full h-full bg-[#020617] rounded-2xl flex items-center justify-center">
              <BrainCircuit className="w-7 h-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter leading-none text-white">
              Welcome, {user?.displayName?.split(' ')[0] || 'Kishor'}
            </h1>
            <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              SpendWise Elite Status
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-2xl glass h-12 w-12 hover:bg-white/10 border-white/10">
            <Bell className="h-6 w-6 text-white/60" />
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl h-12 bg-primary hover:scale-105 transition-all shadow-xl shadow-primary/30 px-6 gap-3">
                <Plus className="h-5 w-5" />
                <span className="text-sm font-black uppercase tracking-widest">Inflow</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[#020617]/95 backdrop-blur-3xl rounded-[3rem] border-white/10 shadow-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black italic">Matrix Entry</DialogTitle>
              </DialogHeader>
              <TransactionForm onSuccess={() => setIsAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="px-6 py-10 space-y-10 max-w-7xl mx-auto relative z-10">
        <section className="bg-white/[0.03] border border-white/[0.08] p-10 rounded-[3rem] shadow-3xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[100px] rounded-full group-hover:bg-primary/20 transition-all duration-1000" />
           <div className="relative z-10 space-y-8">
              <div className="flex justify-between items-start">
                 <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-2">Current Liquidity</p>
                    <h2 className="text-6xl font-black tracking-tighter tabular-nums">₹{stats.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
                 </div>
                 <div className="bg-primary/20 text-primary px-4 py-2 rounded-full border border-primary/30 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Health Score: {stats.healthScore}</span>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="p-6 bg-white/[0.05] rounded-[2rem] border border-white/[0.05] flex items-center justify-between">
                    <div>
                       <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Monthly Inflow</p>
                       <p className="text-xl font-black text-emerald-400">₹{stats.income.toLocaleString('en-IN')}</p>
                    </div>
                    <ArrowUpRight className="h-8 w-8 text-emerald-500/30" />
                 </div>
                 <div className="p-6 bg-white/[0.05] rounded-[2rem] border border-white/[0.05] flex items-center justify-between">
                    <div>
                       <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Monthly Outflow</p>
                       <p className="text-xl font-black text-rose-400">₹{stats.expense.toLocaleString('en-IN')}</p>
                    </div>
                    <ArrowDownRight className="h-8 w-8 text-rose-500/30" />
                 </div>
              </div>
           </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="glass border-none rounded-[3rem] overflow-hidden group">
            <CardHeader className="p-10 pb-0">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 flex items-center gap-3">
                <PieChartIcon className="h-4 w-4 text-primary" />
                Spending Capacity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10 flex flex-col items-center">
              <div className="relative w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Spent', value: stats.expense },
                        { name: 'Remaining', value: Math.max(0, stats.budget - stats.expense) }
                      ]}
                      innerRadius={80}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#8B5CF6" />
                      <Cell fill="rgba(255,255,255,0.05)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black">{Math.round((stats.expense / stats.budget) * 100)}%</span>
                  <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-1">Consumed</p>
                </div>
              </div>
              <div className="w-full flex justify-between items-center mt-6 p-4 bg-white/[0.02] rounded-2xl border border-white/[0.05]">
                 <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">₹{stats.expense.toLocaleString('en-IN')} / ₹{stats.budget.toLocaleString('en-IN')}</span>
                 <Zap className={cn("h-4 w-4", stats.expense > stats.budget ? "text-rose-500" : "text-emerald-500")} />
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-none rounded-[3rem] overflow-hidden lg:col-span-2 relative">
             <div className="absolute top-0 right-0 p-10">
                <Link href="/ai-assistant">
                   <Button variant="ghost" size="sm" className="rounded-full bg-primary/10 text-primary border border-primary/20 font-black text-[9px] uppercase tracking-widest h-10 px-6">
                      Interact with Nexus
                   </Button>
                </Link>
             </div>
             <CardHeader className="p-10 pb-0">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 flex items-center gap-3">
                   <Sparkles className="h-4 w-4 text-accent animate-pulse" />
                   Neural Advisor
                </CardTitle>
             </CardHeader>
             <CardContent className="p-10 space-y-6">
                <div className="flex gap-6 items-center">
                   <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-white/10 shrink-0">
                      <BrainCircuit className="h-10 w-10 text-primary" />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-xl font-black italic">"Analyze my patterns for efficiency..."</h3>
                      <p className="text-xs text-white/40 leading-relaxed font-medium">Nexus Core is ready to optimize your capital. Your savings are up 12% from last cycle.</p>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <Link href="/wrapped" className="p-5 bg-white/[0.03] rounded-3xl border border-white/[0.05] hover:bg-white/[0.08] transition-all group">
                      <Trophy className="h-5 w-5 text-yellow-500 mb-3 group-hover:scale-110 transition-transform" />
                      <p className="text-[9px] font-black uppercase tracking-widest mb-1">Wrapped</p>
                      <p className="text-xs font-bold text-white/60">Annual Report</p>
                   </Link>
                   <Link href="/analytics" className="p-5 bg-white/[0.03] rounded-3xl border border-white/[0.05] hover:bg-white/[0.08] transition-all group">
                      <TrendingUp className="h-5 w-5 text-accent mb-3 group-hover:scale-110 transition-transform" />
                      <p className="text-[9px] font-black uppercase tracking-widest mb-1">Insights</p>
                      <p className="text-xs font-bold text-white/60">Visual Trends</p>
                   </Link>
                   <Link href="/goals" className="p-5 bg-white/[0.03] rounded-3xl border border-white/[0.05] hover:bg-white/[0.08] transition-all group">
                      <Target className="h-5 w-5 text-rose-500 mb-3 group-hover:scale-110 transition-transform" />
                      <p className="text-[9px] font-black uppercase tracking-widest mb-1">Strategic Goals</p>
                      <p className="text-xs font-bold text-white/60">Manifest All</p>
                   </Link>
                </div>
             </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
           <div className="lg:col-span-1 space-y-6">
              <div className="flex items-center justify-between px-4">
                 <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Live Feed</h2>
                 <Link href="/transactions" className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-white">Universal History</Link>
              </div>
              <div className="space-y-4">
                 {transactions?.slice(0, 4).map((tx) => (
                    <motion.div 
                       key={tx.id} 
                       initial={{ opacity: 0, x: -20 }}
                       animate={{ opacity: 1, x: 0 }}
                       className="flex items-center justify-between p-6 glass rounded-[2.5rem] border border-white/[0.03] hover:bg-white/[0.08] transition-all"
                    >
                       <div className="flex items-center gap-5">
                          <div className={cn(
                             "w-12 h-12 rounded-2xl flex items-center justify-center",
                             tx.type === 'income' ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"
                          )}>
                             {tx.type === 'income' ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
                          </div>
                          <div>
                             <p className="font-black text-sm text-white">{tx.category}</p>
                             <p className="text-[8px] text-white/20 font-black uppercase tracking-widest mt-1">
                                {tx.date?.seconds ? format(new Date(tx.date.seconds * 1000), 'MMM dd') : 'LIVE'}
                             </p>
                          </div>
                       </div>
                       <div className={cn("font-black text-base tabular-nums", tx.type === 'income' ? "text-emerald-400" : "text-white")}>
                          {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>

           <Card className="glass border-none lg:col-span-2 rounded-[3rem] overflow-hidden p-10">
              <CardHeader className="p-0 mb-8">
                 <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 flex items-center justify-between">
                    <div className="flex items-center gap-3"><Activity className="h-4 w-4 text-accent" /> Matrix Log</div>
                    <span className="text-[9px] font-black opacity-50 italic">7-Day Trajectory</span>
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={trendData}>
                          <defs>
                             <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <XAxis 
                            dataKey="date" 
                            hide 
                          />
                          <Tooltip 
                             contentStyle={{ background: '#0a0a16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem', fontSize: '10px', fontWeight: '900' }}
                             itemStyle={{ color: '#8B5CF6' }}
                             cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                          />
                          <Area type="monotone" dataKey="amount" stroke="#8B5CF6" strokeWidth={4} fillOpacity={1} fill="url(#colorAmt)" />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </CardContent>
           </Card>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
