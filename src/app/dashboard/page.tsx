
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
  Search,
  Zap,
  Target,
  Trophy,
  Wallet2,
  TrendingDown,
  ChevronRight,
  MoreHorizontal,
  CircleDollarSign
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
              <h1 className="text-2xl font-black tracking-tight leading-none italic">Welcome, {user?.displayName?.split(' ')[0] || 'Elite'}</h1>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.4em] mt-2">SpendWise Elite Status</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" className="rounded-2xl glass h-12 w-12">
                <Bell className="h-6 w-6 text-white/60" />
             </Button>
          </div>
        </div>
      </header>

      <main className="px-8 py-12 space-y-10 max-w-7xl mx-auto relative z-10">
        {/* Top Summary Row */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: 'Current Liquidity', value: stats.balance, icon: Wallet2, color: 'text-primary' },
            { label: 'Inflow', value: stats.income, icon: TrendingUp, color: 'text-emerald-400' },
            { label: 'Outflow', value: stats.expense, icon: TrendingDown, color: 'text-rose-400' },
            { label: 'Spending Capacity', value: stats.budget - stats.expense, icon: CircleDollarSign, color: 'text-accent' },
          ].map((item, i) => (
            <motion.div 
              key={item.label} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="rounded-[3rem] border-none glass-dark p-8 group hover:bg-white/[0.05] transition-all">
                <div className="flex justify-between items-start mb-6">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">{item.label}</p>
                  <div className={cn("p-3 rounded-2xl bg-white/[0.03] border border-white/5 group-hover:scale-110 transition-transform", item.color)}>
                    <item.icon className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-3xl font-black tabular-nums tracking-tighter italic">₹{item.value.toLocaleString('en-IN')}</h3>
                <div className="mt-6 h-1 w-full bg-white/[0.03] rounded-full overflow-hidden">
                   <div className={cn("h-full transition-all duration-1000", item.color === 'text-primary' ? 'bg-primary w-2/3' : 'bg-current w-1/2')} />
                </div>
              </Card>
            </motion.div>
          ))}
        </section>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Budget Progress Donut */}
          <Card className="rounded-[3rem] border-none glass-dark lg:col-span-1 p-8">
            <CardHeader className="p-0 mb-8">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Budget Neural Status</CardTitle>
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
              <div className="w-full space-y-4 mt-8">
                <div className="flex justify-between items-center p-4 glass rounded-2xl">
                  <div className="flex items-center gap-3"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Outflow</span></div>
                  <span className="text-xs font-black">₹{stats.expense.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center p-4 glass rounded-2xl">
                  <div className="flex items-center gap-3"><span className="w-2.5 h-2.5 rounded-full bg-white/10" /> <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Limit</span></div>
                  <span className="text-xs font-black">₹{stats.budget.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Sector Breakdown */}
          <Card className="rounded-[3rem] border-none glass-dark lg:col-span-1 p-8">
            <CardHeader className="p-0 mb-8 flex flex-row justify-between items-center">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Sector Analysis</CardTitle>
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
            <div className="grid grid-cols-1 gap-3">
              {categoryData.slice(0, 4).map((cat, i) => (
                <div key={cat.name} className="flex items-center justify-between p-3 glass rounded-2xl">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/70">{cat.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-white/40">{cat.percent}%</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Health Index */}
          <Card className="rounded-[3rem] border-none glass-dark lg:col-span-1 p-8">
            <CardHeader className="p-0 mb-10">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 flex justify-between items-center">
                Financial Health Index
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
               <p className="text-sm font-bold text-white/50 italic leading-relaxed px-6">"Matrix stability high. Wealth generation protocols active."</p>
               <Button className="mt-10 rounded-2xl glass border-white/10 hover:bg-white/10 w-full font-black text-[10px] uppercase tracking-[0.3em] h-14" asChild>
                 <Link href="/ai-assistant">Neural Advisor</Link>
               </Button>
            </div>
          </Card>
        </div>

        {/* Recent Activity & Global Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Universal Logs */}
          <Card className="rounded-[3rem] border-none glass-dark p-8">
            <CardHeader className="p-0 mb-8 flex flex-row justify-between items-center">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Universal History</CardTitle>
              <Button variant="ghost" className="text-[9px] font-black uppercase tracking-widest text-white/20 h-8" asChild>
                <Link href="/transactions">View All</Link>
              </Button>
            </CardHeader>
            <div className="space-y-4">
              {transactions?.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between group p-4 hover:bg-white/[0.03] rounded-[2rem] transition-all border border-transparent hover:border-white/5">
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5",
                      tx.type === 'income' ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"
                    )}>
                      {tx.type === 'income' ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
                    </div>
                    <div>
                      <p className="font-black text-base">{tx.category}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mt-1">
                        {tx.date?.seconds ? format(new Date(tx.date.seconds * 1000), 'MMM d, h:mm a') : 'Now'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-black text-lg tabular-nums italic", tx.type === 'income' ? "text-emerald-400" : "text-white")}>
                      {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
              {(!transactions || transactions.length === 0) && (
                <div className="h-40 flex flex-col items-center justify-center text-white/10 font-black uppercase tracking-[0.4em] text-[10px]">
                  No entries detected
                </div>
              )}
            </div>
          </Card>

          {/* Neural Insights & Actions */}
          <div className="space-y-8">
            <Card className="rounded-[3rem] border-none glass-dark p-8 overflow-hidden relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[80px] rounded-full" />
               <CardHeader className="p-0 mb-8 flex flex-row justify-between items-center">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 flex items-center gap-3">
                     Neural Insights <Sparkles className="h-4 w-4 text-accent animate-pulse" />
                  </CardTitle>
                  <span className="bg-primary text-white px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">Active</span>
               </CardHeader>
               <div className="space-y-4">
                  {[
                    { text: "System detected high spending in 'Entertainment'. Recommend 12% reduction for protocol optimization.", color: "bg-rose-500/5 border-rose-500/10 text-rose-200" },
                    { text: "Liquidity up by ₹12,400. Suggest redirecting excess to 'Strategic Goals'.", color: "bg-emerald-500/5 border-emerald-500/10 text-emerald-200" },
                  ].map((insight, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ x: 20, opacity: 0 }} 
                      animate={{ x: 0, opacity: 1 }} 
                      transition={{ delay: i * 0.2 }}
                      className={cn("p-6 rounded-[2rem] border relative overflow-hidden", insight.color)}
                    >
                      <p className="text-xs font-bold leading-relaxed italic">{insight.text}</p>
                    </motion.div>
                  ))}
                  <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                     <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                          <Button className="flex flex-col gap-3 h-28 rounded-[2rem] bg-primary shadow-2xl shadow-primary/20 hover:scale-105 transition-all">
                             <Plus className="h-7 w-7" />
                             <span className="text-[8px] font-black uppercase tracking-[0.2em]">Matrix Entry</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] glass rounded-[3rem] border-white/10 p-0 overflow-hidden">
                          <div className="p-10">
                            <DialogHeader className="mb-8">
                              <DialogTitle className="text-3xl font-black italic tracking-tighter">New Entry</DialogTitle>
                              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">Financial Protocol Initiation</p>
                            </DialogHeader>
                            <TransactionForm onSuccess={() => setIsAddOpen(false)} />
                          </div>
                        </DialogContent>
                     </Dialog>
                     <Button className="flex flex-col gap-3 h-28 rounded-[2rem] bg-emerald-500 shadow-2xl shadow-emerald-500/20 hover:scale-105 transition-all" onClick={() => setIsAddOpen(true)}>
                        <TrendingUp className="h-7 w-7" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">Inflow Entry</span>
                     </Button>
                     <Button variant="ghost" className="flex flex-col gap-3 h-28 rounded-[2rem] glass border-white/10 hover:bg-white/10 hover:scale-105 transition-all">
                        <Zap className="h-7 w-7 text-accent" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">Scan Data</span>
                     </Button>
                     <Button variant="ghost" className="flex flex-col gap-3 h-28 rounded-[2rem] glass border-white/10 hover:bg-white/10 hover:scale-105 transition-all" asChild>
                        <Link href="/ai-assistant">
                           <Sparkles className="h-7 w-7 text-primary" />
                           <span className="text-[8px] font-black uppercase tracking-[0.2em]">AI Advisor</span>
                        </Link>
                     </Button>
                  </div>
               </div>
            </Card>

            {/* Area Trend Visualization */}
            <Card className="rounded-[3rem] border-none glass-dark p-8">
              <CardHeader className="p-0 mb-8">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Temporal Pulse</CardTitle>
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
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
