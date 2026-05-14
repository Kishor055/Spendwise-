"use client";

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as ChartIcon, TrendingUp, ChevronLeft, BarChart3, Filter } from 'lucide-react';
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
  CartesianGrid 
} from 'recharts';

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: any;
}

const COLORS = ['#523399', '#69A9ED', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];

export default function AnalyticsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

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
        : 'Today';
      
      if (!groups[dateKey]) groups[dateKey] = { income: 0, expense: 0 };
      if (tx.type === 'income') groups[dateKey].income += tx.amount;
      else groups[dateKey].expense += tx.amount;
    });

    return Object.entries(groups).map(([name, vals]) => ({ name, ...vals })).reverse();
  }, [transactions]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-6 pt-12 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/dashboard"><ChevronLeft className="h-6 w-6" /></Link>
          </Button>
          <h1 className="text-2xl font-black tracking-tight">Financial Insights</h1>
        </div>
        <Button variant="outline" size="icon" className="rounded-full">
          <Filter className="h-4 w-4" />
        </Button>
      </header>

      <main className="px-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex bg-muted/50 backdrop-blur-md rounded-[1.5rem] p-1.5">
          <Button 
            variant={activeTab === 'expense' ? 'default' : 'ghost'} 
            className={cn("flex-1 rounded-2xl font-bold", activeTab === 'expense' && "shadow-lg")}
            onClick={() => setActiveTab('expense')}
          >
            Expenses
          </Button>
          <Button 
            variant={activeTab === 'income' ? 'default' : 'ghost'} 
            className={cn("flex-1 rounded-2xl font-bold", activeTab === 'income' && "shadow-lg")}
            onClick={() => setActiveTab('income')}
          >
            Income
          </Button>
        </div>

        {/* Breakdown Chart */}
        <Card className="rounded-[2.5rem] shadow-xl border-none glass-card">
          <CardHeader>
            <CardTitle className="text-base font-black flex items-center gap-2">
              <ChartIcon className="h-5 w-5 text-primary" />
              Category Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                    />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center px-8 opacity-50">
                  <TrendingUp className="h-14 w-14 mb-4" />
                  <p className="font-medium">Analyze your spending trends here.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trend Chart */}
        <Card className="rounded-[2.5rem] shadow-xl border-none glass-card">
          <CardHeader>
            <CardTitle className="text-base font-black flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-accent" />
              Recent Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={12} />
                    <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center opacity-30 italic">No trend data</div>
              )}
            </div>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <h3 className="text-xl font-black tracking-tight">Top Categories</h3>
          <div className="space-y-3">
            {pieData.sort((a: any, b: any) => b.value - a.value).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between p-5 glass-card rounded-[1.5rem] border-none shadow-sm transition-transform active:scale-95">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm" 
                    style={{ backgroundColor: `${COLORS[index % COLORS.length]}20`, color: COLORS[index % COLORS.length] }} 
                  >
                    <ChartIcon className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-sm">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-base block">${(item.value as number).toLocaleString()}</span>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
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
