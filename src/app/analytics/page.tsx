"use client";

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as ChartIcon, TrendingUp, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
}

const COLORS = ['#523399', '#69A9ED', '#43A047', '#E53935', '#F59E0B', '#10B981', '#6366F1'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'transactions'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction)));
    });
    return () => unsub();
  }, [user]);

  const chartData = useMemo(() => {
    const data = transactions
      .filter(tx => tx.type === activeTab)
      .reduce((acc: any, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
      }, {});

    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [transactions, activeTab]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-6 pt-10 pb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard"><ChevronLeft className="h-6 w-6" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Financial Insights</h1>
      </header>

      <main className="px-6 space-y-8 max-w-4xl mx-auto">
        <div className="flex bg-muted rounded-2xl p-1">
          <Button 
            variant={activeTab === 'expense' ? 'default' : 'ghost'} 
            className="flex-1 rounded-xl"
            onClick={() => setActiveTab('expense')}
          >
            Expenses
          </Button>
          <Button 
            variant={activeTab === 'income' ? 'default' : 'ghost'} 
            className="flex-1 rounded-xl"
            onClick={() => setActiveTab('income')}
          >
            Income
          </Button>
        </div>

        <Card className="rounded-[2rem] shadow-xl border-none">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <ChartIcon className="h-5 w-5 text-primary" />
              Category Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center px-8">
                  <TrendingUp className="h-12 w-12 mb-4 opacity-20" />
                  <p>Not enough data to generate chart. Start adding transactions!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <h3 className="text-xl font-bold">Details by Category</h3>
          <div className="space-y-2">
            {[...chartData].sort((a: any, b: any) => b.value - a.value).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between p-4 glass-card rounded-2xl">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                  />
                  <span className="font-medium">{item.name}</span>
                </div>
                <span className="font-bold">${(item.value as number).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}