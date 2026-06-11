'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { analyzeSubscriptions } from '@/ai/flows/subscription-analyzer-flow';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  CreditCard, 
  ChevronLeft, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Trash2,
  TrendingDown,
  Sparkles,
  PieChart
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function SubscriptionsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc'), limit(100));
  }, [firestore, user]);

  const { data: transactions } = useCollection(transactionsQuery);

  useEffect(() => {
    async function runAnalysis() {
      if (!transactions || transactions.length < 10 || isAnalyzing) return;
      setIsAnalyzing(true);
      try {
        const result = await analyzeSubscriptions({
          transactions: transactions.filter(t => t.type === 'expense').map(t => ({
            merchant: t.merchant || t.category,
            category: t.category,
            amount: t.amount,
            date: t.date?.seconds ? new Date(t.date.seconds * 1000).toISOString() : new Date().toISOString()
          }))
        });
        setAnalysis(result);
      } catch (e) {
        console.error(e);
      } finally {
        setIsAnalyzing(false);
      }
    }
    runAnalysis();
  }, [transactions]);

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-44 selection:bg-primary/30">
      <header className="px-8 py-10 bg-[#020617]/80 backdrop-blur-3xl sticky top-0 z-50 border-b border-white/5">
        <div className="flex items-center gap-6 max-w-7xl mx-auto">
          <Button variant="ghost" size="icon" className="rounded-2xl glass h-14 w-14" asChild>
            <Link href="/dashboard"><ChevronLeft className="h-7 w-7" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight italic">Subscription Intelligence</h1>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 mt-1">AI Recurring Pattern Detection</p>
          </div>
        </div>
      </header>

      <main className="px-8 py-12 space-y-12 max-w-7xl mx-auto">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <Card className="rounded-[3rem] glass-dark border-none p-10 relative overflow-hidden bg-gradient-to-br from-primary/10 to-transparent">
              <Sparkles className="h-12 w-12 text-primary mb-6 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-4">Projected Annual Burn</p>
              <h2 className="text-6xl font-black italic tracking-tighter">₹{analysis?.annualLeakAmount?.toLocaleString() || '0'}</h2>
              <div className="mt-8 flex items-center gap-3 text-rose-400 bg-rose-400/10 w-fit px-4 py-1.5 rounded-full border border-rose-400/20">
                 <TrendingDown className="h-4 w-4" />
                 <span className="text-[8px] font-black uppercase tracking-widest">Efficiency Leak Detected</span>
              </div>
           </Card>

           <div className="space-y-6 flex flex-col justify-center">
              <h3 className="text-xl font-black italic">Active Neural Signals</h3>
              <p className="text-white/40 font-medium leading-relaxed">SpendWise AI has scanned your universal history and identified patterns that indicate recurring services. Monitor these to optimize your professional burn rate.</p>
           </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <AnimatePresence>
              {analysis?.detectedSubscriptions.map((sub: any, i: number) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="rounded-[2.5rem] glass-dark border-none p-8 group hover:bg-white/[0.05] transition-all">
                    <div className="flex justify-between items-start mb-8">
                       <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <CreditCard className="h-7 w-7" />
                       </div>
                       <div className="text-right">
                          <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-1">Confidence</p>
                          <p className="text-xs font-black text-emerald-400">{Math.round(sub.confidence * 100)}%</p>
                       </div>
                    </div>
                    <div className="space-y-1 mb-8">
                       <h4 className="text-xl font-black">{sub.name}</h4>
                       <p className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">{sub.cycle} billing cycle</p>
                    </div>
                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                       <div>
                          <p className="text-[8px] font-black uppercase text-white/20">Estimated Cost</p>
                          <p className="text-2xl font-black italic">₹{sub.amount}</p>
                       </div>
                       <Button variant="ghost" size="icon" className="text-white/10 hover:text-rose-500"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
           </AnimatePresence>
        </div>

        {isAnalyzing && (
           <div className="flex flex-col items-center justify-center py-20 opacity-40">
              <Loader2 className="h-10 w-10 animate-spin mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.5em]">Scanning temporal patterns...</p>
           </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
