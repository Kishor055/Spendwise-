
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
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TransactionForm } from '@/components/transactions/transaction-form';
import { Progress } from '@/components/ui/progress';
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
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
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
    if (!transactions) return [];
    return transactions.slice(0, 10).map(t => ({
      date: format(new Date(t.date?.seconds * 1000 || Date.now()), 'MMM d'),
      amount: t.amount,
      type: t.type
    })).reverse();
  }, [transactions]);

  if (isUserLoading || (isTransactionsLoading && !transactions)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#030616]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-10 w-10 text-primary opacity-50" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-44 text-white bg-[#030616] overflow-x-hidden">
      {/* Aurora Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[60%] bg-primary/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-accent/5 blur-[120px] rounded-full" />
      </div>

      <header className="px-6 py-6 flex justify-between items-center sticky top-0 z-50 bg-[#030616]/60 backdrop-blur-2xl border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-accent p-[1px] shadow-lg shadow-primary/20">
            <div className="w-full h-full bg-[#030616] rounded-2xl flex items-center justify-center">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none text-white">
              Hello, {user?.displayName?.split(' ')[0] || 'Explorer'} 👋
            </h1>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Track, Analyze & Improve</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:flex items-center group">
             <Search className="absolute left-3 h-4 w-4 text-white/20" />
             <input placeholder="Search anything..." className="pl-10 pr-4 h-10 w-64 bg-white/5 rounded-xl border border-white/10 outline-none focus:border-primary/50 transition-all text-xs" />
          </div>
          <Button variant="ghost" size="icon" className="rounded-xl glass h-10 w-10 hover:bg-white/10 border-white/10">
            <Bell className="h-5 w-5 text-white/60" />
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl h-10 bg-primary hover:scale-105 transition-all shadow-lg shadow-primary/20 px-4 gap-2">
                <Plus className="h-4 w-4" />
                <span className="text-xs font-bold">Add New</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[#030616]/95 backdrop-blur-3xl rounded-[2.5rem] border-white/5 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-black">Quick Entry</DialogTitle>
              </DialogHeader>
              <TransactionForm onSuccess={() => setIsAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="px-6 py-8 space-y-8 max-w-7xl mx-auto relative z-10">
        {/* Top Stats Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: 'Total Balance', value: stats.balance, icon: Wallet, color: 'primary', trend: '+12.5%' },
            { title: 'Monthly Income', value: stats.income, icon: ArrowUpRight, color: 'emerald-500', trend: '+8.3%' },
            { title: 'Monthly Expenses', value: stats.expense, icon: ArrowDownRight, color: 'rose-500', trend: '-5.6%' },
            { title: 'Total Savings', value: stats.savings, icon: Target, color: 'accent', trend: '+15.7%' }
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="glass-card border-none overflow-hidden relative group">
                <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 rounded-full", `bg-${item.color}`)} />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn("p-3 rounded-xl bg-white/5 border border-white/10", `text-${item.color}`)}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className={cn("text-[10px] font-black px-2 py-1 rounded-full bg-white/5", item.trend.startsWith('+') ? "text-emerald-400" : "text-rose-400")}>
                      {item.trend} <span className="text-white/20 font-medium">from last month</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{item.title}</p>
                    <p className="text-2xl font-black tracking-tighter">₹{item.value.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="h-10 mt-4 opacity-30">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData.filter(d => d.type === (item.title.includes('Income') ? 'income' : 'expense'))}>
                           <Area type="monotone" dataKey="amount" stroke={item.color === 'primary' ? '#8B5CF6' : '#06B6D4'} fill="transparent" strokeWidth={2} />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>

        {/* Middle Visualization Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Budget Overview */}
          <Card className="glass border-none lg:col-span-1 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-0">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                <PieChartIcon className="h-4 w-4 text-primary" />
                Budget Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 flex flex-col items-center">
              <div className="relative w-full h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Spent', value: stats.expense },
                        { name: 'Remaining', value: Math.max(0, stats.budget - stats.expense) }
                      ]}
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#8B5CF6" />
                      <Cell fill="rgba(255,255,255,0.05)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black">{Math.round((stats.expense / stats.budget) * 100)}%</span>
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Of Monthly Budget</span>
                </div>
              </div>
              <div className="w-full grid grid-cols-2 gap-4 mt-6">
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Spent</p>
                    <p className="text-sm font-bold">₹{stats.expense.toLocaleString('en-IN')}</p>
                 </div>
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Remaining</p>
                    <p className="text-sm font-bold">₹{Math.max(0, stats.budget - stats.expense).toLocaleString('en-IN')}</p>
                 </div>
              </div>
            </CardContent>
          </Card>

          {/* Expense by Category */}
          <Card className="glass border-none lg:col-span-1 rounded-[2.5rem] overflow-hidden">
             <CardHeader className="p-8 pb-0">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center justify-between">
                   <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-accent" /> Expense by Category</div>
                   <button className="text-[9px] hover:text-white transition-colors">View All</button>
                </CardTitle>
             </CardHeader>
             <CardContent className="p-8">
                <div className="h-[200px] w-full mb-8">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie data={categoryData} dataKey="value" innerRadius={0} outerRadius={80}>
                            {categoryData.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                         </Pie>
                         <Tooltip contentStyle={{ background: '#030616', border: 'none', borderRadius: '1rem', fontSize: '10px' }} />
                      </PieChart>
                   </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                   {categoryData.map((cat, i) => (
                      <div key={cat.name} className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-xs font-bold text-white/80">{cat.name}</span>
                         </div>
                         <span className="text-xs font-black">{Math.round((cat.value / stats.expense) * 100)}%</span>
                      </div>
                   ))}
                </div>
             </CardContent>
          </Card>

          {/* Financial Health Score */}
          <Card className="glass border-none lg:col-span-1 rounded-[2.5rem] overflow-hidden relative">
             <CardHeader className="p-8 pb-0">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                   <Activity className="h-4 w-4 text-rose-500" />
                   Financial Health Score
                </CardTitle>
             </CardHeader>
             <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                <div className="relative w-48 h-48 mb-6">
                   <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/5" />
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray={2 * Math.PI * 45} strokeDashoffset={2 * Math.PI * 45 * (1 - stats.healthScore / 100)} className="text-accent drop-shadow-[0_0_8px_rgba(6,182,212,0.5)] transition-all duration-1000" />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-black">{stats.healthScore}</span>
                      <span className="text-[10px] font-black text-accent uppercase tracking-widest mt-1">Excellent</span>
                   </div>
                </div>
                <p className="text-sm text-white/60 font-medium px-6">You are doing great! Keep tracking to improve more.</p>
                <Button variant="ghost" className="mt-6 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 rounded-full border border-white/5">Analyze Full Stats</Button>
             </CardContent>
          </Card>
        </section>

        {/* Bottom Section: Grid of History, AI, and Trends */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
           {/* Recent Transactions */}
           <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between px-2">
                 <h2 className="text-xs font-black uppercase tracking-widest text-white/40">Recent Transactions</h2>
                 <Link href="/transactions" className="text-[10px] font-black text-primary hover:text-white transition-colors">View All</Link>
              </div>
              <div className="space-y-3">
                 {transactions?.slice(0, 5).map((tx) => (
                    <motion.div 
                       key={tx.id} 
                       initial={{ opacity: 0, x: -20 }}
                       animate={{ opacity: 1, x: 0 }}
                       className="flex items-center justify-between p-4 bg-white/5 rounded-[1.5rem] border border-white/[0.03] hover:bg-white/[0.08] transition-all group"
                    >
                       <div className="flex items-center gap-4">
                          <div className={cn(
                             "w-10 h-10 rounded-xl flex items-center justify-center",
                             tx.type === 'income' ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"
                          )}>
                             {tx.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                          </div>
                          <div>
                             <p className="font-bold text-sm text-white/90">{tx.category}</p>
                             <p className="text-[8px] text-white/20 font-black uppercase tracking-widest mt-0.5">{tx.id.slice(0, 8)} • Today</p>
                          </div>
                       </div>
                       <div className={cn("font-black text-sm tabular-nums", tx.type === 'income' ? "text-emerald-400" : "text-white")}>
                          {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>

           {/* AI Insights & Chat Link */}
           <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* AI Insights Card */}
                 <Card className="glass border-none rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-8">
                       <CardTitle className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center justify-between">
                          <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary animate-pulse" /> AI Insights</div>
                          <span className="bg-primary/20 text-primary text-[8px] px-2 py-0.5 rounded-full">NEW</span>
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="px-8 pb-8 space-y-4">
                       <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex gap-4">
                          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                             <TrendingUp className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-xs text-white/70 leading-relaxed">You spent <span className="text-white font-bold">18% more on Food</span> this month. Try cooking at home to save around ₹2,500.</p>
                       </div>
                       <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex gap-4">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                             <Target className="h-4 w-4 text-emerald-500" />
                          </div>
                          <p className="text-xs text-white/70 leading-relaxed">Great! You saved <span className="text-white font-bold">₹5,200 more</span> than last month. Keep going, you're on the right track.</p>
                       </div>
                    </CardContent>
                 </Card>

                 {/* Spending Trend Mini Line Chart */}
                 <Card className="glass border-none rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-8">
                       <CardTitle className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center justify-between">
                          <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-accent" /> Spending Trend</div>
                          <span className="text-[9px]">This Month</span>
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                       <div className="h-[140px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                             <LineChart data={trendData}>
                                <Line type="monotone" dataKey="amount" stroke="#06B6D4" strokeWidth={3} dot={{ r: 4, fill: '#06B6D4', strokeWidth: 0 }} />
                                <Tooltip contentStyle={{ background: '#030616', border: 'none', borderRadius: '1rem' }} />
                             </LineChart>
                          </ResponsiveContainer>
                       </div>
                    </CardContent>
                 </Card>
              </div>

              {/* Quick Action Button for AI Chat */}
              <Link href="/ai-assistant">
                 <div className="group relative overflow-hidden bg-gradient-to-r from-primary to-accent p-8 rounded-[2.5rem] flex items-center justify-between shadow-2xl hover:scale-[1.01] transition-all">
                    <div className="relative z-10 flex items-center gap-6">
                       <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                          <BrainCircuit className="w-10 h-10" />
                       </div>
                       <div>
                          <h3 className="text-2xl font-black italic">Hi {user?.displayName?.split(' ')[0] || 'User'}!</h3>
                          <p className="text-sm font-bold opacity-80 mt-1">Your Neural Financial Assistant is ready. How can I help today?</p>
                       </div>
                    </div>
                    <ChevronRight className="w-8 h-8 text-white opacity-20 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2" />
                 </div>
              </Link>
           </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
