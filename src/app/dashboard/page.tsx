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
  MoreHorizontal
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
    if (!transactions) return { balance: 0, income: 0, expense: 0, savings: 0, healthScore: 0, budget: 45000 };
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

    return { ...totals, savings, healthScore, budget: 45000 };
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
    // Last 7 days simulation
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

  if (isUserLoading || (isTransactionsLoading && !transactions)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#020617]">
        <Loader2 className="h-12 w-12 text-primary animate-spin opacity-50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-44 text-white bg-[#020617]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[60%] bg-primary/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-accent/5 blur-[120px] rounded-full" />
      </div>

      <header className="px-6 py-8 sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-3xl border-b border-white/[0.05]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-accent p-[1px]">
              <div className="w-full h-full bg-[#020617] rounded-2xl flex items-center justify-center">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none">Hello, {user?.displayName?.split(' ')[0] || 'Aman'} 👋</h1>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mt-1.5">Track, Analyze & Improve Financial Health</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center glass-pill px-4 h-10 border-white/5 gap-3">
                <Search className="h-4 w-4 text-white/40" />
                <span className="text-[10px] text-white/30 uppercase font-black">Search anything...</span>
             </div>
             <Button variant="ghost" size="icon" className="rounded-xl glass h-10 w-10">
                <Bell className="h-5 w-5 text-white/60" />
             </Button>
          </div>
        </div>
      </header>

      <main className="px-6 py-10 space-y-8 max-w-7xl mx-auto relative z-10">
        {/* Top Summary Row */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Balance', value: stats.balance, icon: Wallet2, trend: '+12.5% from last month', color: 'text-primary' },
            { label: 'Monthly Income', value: stats.income, icon: TrendingUp, trend: '+8.3% from last month', color: 'text-emerald-400' },
            { label: 'Monthly Expenses', value: stats.expense, icon: TrendingDown, trend: '-5.6% from last month', color: 'text-rose-400' },
            { label: 'Total Savings', value: stats.savings, icon: Trophy, trend: '+15.7% from last month', color: 'text-accent' },
          ].map((item, i) => (
            <motion.div 
              key={item.label} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="glass-card border-white/5 bg-white/[0.02]">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{item.label}</p>
                    <div className={cn("p-2 rounded-xl bg-white/[0.03] border border-white/5", item.color)}>
                      <item.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-black tabular-nums">₹{item.value.toLocaleString('en-IN')}</h3>
                  <div className="mt-4 flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{item.trend}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Budget Overview */}
          <Card className="glass-card border-white/5 lg:col-span-1">
            <CardHeader className="p-8 pb-0">
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-white/40">Budget Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-8 flex flex-col items-center">
              <div className="relative w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Spent', value: stats.expense },
                        { name: 'Remaining', value: Math.max(0, stats.budget - stats.expense) }
                      ]}
                      innerRadius={70}
                      outerRadius={95}
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
                  <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">of monthly budget</p>
                </div>
              </div>
              <div className="w-full space-y-4 mt-6">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary" /> Spent</div>
                  <span>₹{stats.expense.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-white/10" /> Remaining</div>
                  <span>₹{(stats.budget - stats.expense).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expense by Category */}
          <Card className="glass-card border-white/5 lg:col-span-1">
            <CardHeader className="p-8 pb-0 flex flex-row justify-between items-center">
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-white/40">Expense by Category</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest text-white/30">View All</Button>
            </CardHeader>
            <CardContent className="p-8">
              <div className="h-[220px] w-full mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', background: '#0a0a16', fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {categoryData.map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{cat.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-white/40">{cat.percent}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Financial Health Score */}
          <Card className="glass-card border-white/5 lg:col-span-1">
            <CardHeader className="p-8 pb-0">
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-white/40 flex justify-between items-center">
                Financial Health Score
                <Activity className="h-4 w-4 text-accent" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 flex flex-col items-center justify-center text-center">
               <div className="relative w-40 h-40 mb-8">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                     <circle className="text-white/[0.05]" strokeWidth="8" stroke="currentColor" fill="transparent" r="42" cx="50" cy="50" />
                     <circle 
                        className="text-accent transition-all duration-1000" 
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
                    <span className="text-5xl font-black accent-glow">{stats.healthScore}</span>
                    <span className="text-[10px] font-black text-accent uppercase tracking-widest mt-1">Excellent</span>
                  </div>
               </div>
               <p className="text-sm font-bold text-white/60 italic leading-relaxed px-4">"You are doing great! Keep tracking to improve more."</p>
               <Button className="mt-8 rounded-2xl glass border-white/10 hover:bg-white/10 w-full font-black text-[10px] uppercase tracking-[0.2em] h-12">Optimize Wealth</Button>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Transactions */}
          <Card className="glass-card border-white/5">
            <CardHeader className="p-8 pb-4 flex flex-row justify-between items-center">
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-white/40">Recent Transactions</CardTitle>
              <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-white/30">View All</Button>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              {transactions?.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between group p-3 hover:bg-white/[0.02] rounded-2xl transition-all">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      tx.type === 'income' ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"
                    )}>
                      {tx.type === 'income' ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
                    </div>
                    <div>
                      <p className="font-black text-sm">{tx.category}</p>
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mt-1">
                        {tx.date?.seconds ? format(new Date(tx.date.seconds * 1000), 'MMM d, h:mm a') : 'Now'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-black text-base tabular-nums", tx.type === 'income' ? "text-emerald-400" : "text-rose-400")}>
                      {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI Insights & Quick Actions */}
          <div className="space-y-8">
            <Card className="glass-card border-white/5 overflow-hidden">
               <CardHeader className="p-8 pb-4 flex flex-row justify-between items-center">
                  <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
                     AI Insights <Sparkles className="h-4 w-4 text-accent animate-pulse" />
                  </CardTitle>
                  <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">New</span>
               </CardHeader>
               <CardContent className="p-8 pt-0 space-y-4">
                  {[
                    { text: "You spent 18% more on Food this month. Try cooking at home to save around ₹2,500.", color: "bg-rose-500/10 border-rose-500/20" },
                    { text: "Great! You saved ₹5,200 more than last month. Keep going, you're on the right track.", color: "bg-emerald-500/10 border-emerald-500/20" },
                  ].map((insight, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ x: 20, opacity: 0 }} 
                      animate={{ x: 0, opacity: 1 }} 
                      transition={{ delay: i * 0.2 }}
                      className={cn("p-5 rounded-[2rem] border relative overflow-hidden", insight.color)}
                    >
                      <p className="text-xs font-bold leading-relaxed">{insight.text}</p>
                    </motion.div>
                  ))}
                  <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                     <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                          <Button className="flex flex-col gap-2 h-24 rounded-3xl bg-primary shadow-xl shadow-primary/20">
                             <Plus className="h-6 w-6" />
                             <span className="text-[8px] font-black uppercase tracking-widest">Add Expense</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] glass rounded-[3rem] border-white/10">
                          <DialogHeader><DialogTitle className="text-2xl font-black italic">Matrix Entry</DialogTitle></DialogHeader>
                          <TransactionForm onSuccess={() => setIsAddOpen(false)} />
                        </DialogContent>
                     </Dialog>
                     <Button className="flex flex-col gap-2 h-24 rounded-3xl bg-emerald-500 shadow-xl shadow-emerald-500/20">
                        <TrendingUp className="h-6 w-6" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Add Income</span>
                     </Button>
                     <Button variant="ghost" className="flex flex-col gap-2 h-24 rounded-3xl glass border-white/10">
                        <CreditCard className="h-6 w-6" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Scan Bill</span>
                     </Button>
                     <Button variant="ghost" className="flex flex-col gap-2 h-24 rounded-3xl glass border-white/10" asChild>
                        <Link href="/ai-assistant">
                           <BrainCircuit className="h-6 w-6" />
                           <span className="text-[8px] font-black uppercase tracking-widest">AI Advisor</span>
                        </Link>
                     </Button>
                  </div>
               </CardContent>
            </Card>

            {/* Spending Trend Line Chart */}
            <Card className="glass-card border-white/5">
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-white/40">Spending Trend</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                 <div className="h-[180px] w-full">
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
                          <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: 'rgba(255,255,255,0.2)' }} />
                          <YAxis hide />
                          <Tooltip contentStyle={{ background: '#0a0a16', border: 'none', borderRadius: '1rem', fontSize: '10px' }} />
                          <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorInc)" />
                          <Area type="monotone" dataKey="expense" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
