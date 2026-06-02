
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as ChartIcon, TrendingUp, ChevronLeft, BarChart3, Filter, Activity, PieChart as PieIcon, LineChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: any;
}

const COLORS = ['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#6366F1'];

export default function AnalyticsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc'));
  }, [firestore, user]);

  const { data: transactions } = useCollection<Transaction>(transactionsQuery);

  const pieData = useMemo(() => {
    if (!transactions) return [];
    const data = transactions
      .filter(tx => tx.type === activeTab)
      .reduce((acc: Record<string, number>, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
      }, {});

    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [transactions, activeTab]);

  const totalForTab = useMemo(() => {
    return pieData.reduce((sum, item) => sum + (item.value as number), 0);
  }, [pieData]);

  const barData = useMemo(() => {
    if (!transactions) return [];
    const groups: Record<string, { income: number, expense: number }> = {};
    
    transactions.slice(0, 30).forEach(tx => {
      const dateKey = tx.date?.seconds 
        ? new Date(tx.date.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'Live';
      
      if (!groups[dateKey]) groups[dateKey] = { income: 0, expense: 0 };
      if (tx.type === 'income') groups[dateKey].income += tx.amount;
      else groups[dateKey].expense += tx.amount;
    });

    return Object.entries(groups).map(([name, vals]) => ({ name, ...vals })).reverse();
  }, [transactions]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen pb-44 bg-[#020617] text-white">
      <header className="px-8 pt-12 pb-8 flex items-center justify-between sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-3xl border-b border-white/[0.05]">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" className="rounded-2xl glass h-12 w-12" asChild>
            <Link href="/dashboard"><ChevronLeft className="h-6 w-6" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight italic">Visual Insights</h1>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 mt-1">Matrix Pattern Analysis</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-2xl glass h-12 w-12">
          <Filter className="h-5 w-5" />
        </Button>
      </header>

      <main className="px-8 space-y-10 max-w-7xl mx-auto py-10">
        <div className="flex glass rounded-[2.5rem] p-2 shadow-2xl max-w-md mx-auto">
          <Button 
            variant={activeTab === 'expense' ? 'default' : 'ghost'} 
            className={cn("flex-1 rounded-[1.8rem] font-black uppercase text-[10px] tracking-[0.2em] h-12 transition-all", activeTab === 'expense' && "shadow-2xl bg-primary")}
            onClick={() => setActiveTab('expense')}
          >
            Outflow
          </Button>
          <Button 
            variant={activeTab === 'income' ? 'default' : 'ghost'} 
            className={cn("flex-1 rounded-[1.8rem] font-black uppercase text-[10px] tracking-[0.2em] h-12 transition-all", activeTab === 'income' && "shadow-2xl bg-primary")}
            onClick={() => setActiveTab('income')}
          >
            Inflow
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="rounded-[3rem] border-none glass-dark p-8">
            <CardHeader className="p-0 mb-8">
              <CardTitle className="text-[10px] font-black flex items-center gap-3 uppercase tracking-[0.3em] text-white/30">
                <PieIcon className="h-5 w-5 text-primary" />
                Category Distribution
              </CardTitle>
            </CardHeader>
            <div className="h-[320px] w-full">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={10}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '24px', border: 'none', background: '#0a0a16', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', fontWeight: '900', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-white/10 text-center">
                  <Activity className="h-16 w-16 mb-4 opacity-10" />
                  <p className="font-black uppercase tracking-[0.4em] text-[10px]">Insufficient temporal data</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="rounded-[3rem] border-none glass-dark p-8">
            <CardHeader className="p-0 mb-8">
              <CardTitle className="text-[10px] font-black flex items-center gap-3 uppercase tracking-[0.3em] text-white/30">
                <LineChart className="h-5 w-5 text-accent" />
                Evolution Trend
              </CardTitle>
            </CardHeader>
            <div className="h-[320px] w-full">
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={barData}>
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
                    <Tooltip 
                      contentStyle={{ borderRadius: '20px', border: 'none', background: '#0a0a16', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', fontWeight: '900' }}
                    />
                    <Area type="monotone" dataKey="expense" stroke="#8B5CF6" strokeWidth={4} fillOpacity={1} fill="url(#colorExp)" />
                    <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#colorInc)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-white/10 font-black uppercase text-[10px] tracking-[0.4em]">No trend history detected</div>
              )}
            </div>
          </Card>
        </div>

        <section className="space-y-6">
          <h3 className="text-xl font-black tracking-tight italic">Top Sectors</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pieData.sort((a: any, b: any) => b.value - a.value).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between p-6 glass-dark rounded-[2.5rem] border border-white/[0.03] transition-all hover:bg-white/[0.06] group">
                <div className="flex items-center gap-5">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/5" 
                    style={{ backgroundColor: `${COLORS[index % COLORS.length]}15`, color: COLORS[index % COLORS.length] }} 
                  >
                    <PieIcon className="h-7 w-7" />
                  </div>
                  <div>
                    <span className="font-black text-base">{item.name}</span>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mt-1">Sector Efficiency: High</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-xl block tabular-nums italic">₹{(item.value as number).toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-accent font-black uppercase tracking-widest mt-1 block">
                    {Math.round(((item.value as number) / totalForTab) * 100 || 0)}% of total
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
