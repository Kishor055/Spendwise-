
'use client';

import { useState } from 'react';
import { getStrategicAnalysis } from '@/ai/flows/strategic-analysis-flow';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart as LineChartIcon, 
  Search, 
  Loader2, 
  ChevronLeft, 
  TrendingUp, 
  Briefcase, 
  Building2, 
  Activity,
  Zap,
  Cpu,
  Globe,
  ShieldCheck,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

export default function MarketAnalysisPage() {
  const [query, setQuery] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const result = await getStrategicAnalysis({ entityName: query });
      setAnalysis(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-44 selection:bg-primary/30">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/5 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[150px] rounded-full" />
      </div>

      <header className="px-8 py-10 bg-[#020617]/80 backdrop-blur-3xl sticky top-0 z-50 border-b border-white/5">
        <div className="flex items-center gap-6 max-w-7xl mx-auto">
          <Button variant="ghost" size="icon" className="rounded-2xl glass h-14 w-14 hover:bg-white/10" asChild>
            <Link href="/dashboard"><ChevronLeft className="h-7 w-7" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight italic">Quantum Pulse</h1>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 mt-1">Strategic Market Intelligence</p>
          </div>
        </div>
      </header>

      <main className="px-8 py-12 space-y-12 max-w-7xl mx-auto relative z-10">
        <section className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4">
             <div className="inline-flex items-center gap-3 bg-accent/10 px-6 py-2 rounded-full border border-accent/20">
                <Cpu className="h-4 w-4 text-accent animate-spin-slow" />
                <span className="text-[10px] font-black uppercase tracking-widest text-accent">Python Core Engine Active</span>
             </div>
             <h2 className="text-5xl font-black tracking-tighter italic">Analyze the Matrix.</h2>
             <p className="text-white/40 font-medium max-w-md mx-auto">Query any company or industry sector to receive stochastic projections and job market correlation analysis.</p>
          </div>

          <form onSubmit={handleAnalyze} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-[2.5rem] blur opacity-10 group-focus-within:opacity-40 transition duration-700"></div>
            <Input 
              placeholder="Enter Entity (e.g. Nvidia, AI Chips, Real Estate)..." 
              className="h-20 rounded-[2.5rem] glass border-white/10 shadow-3xl text-lg font-bold placeholder:text-white/20 px-10 pr-28"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button 
              type="submit"
              size="icon" 
              className="absolute right-4 top-4 h-12 w-12 rounded-[1.5rem] bg-primary hover:bg-primary/80 transition-all shadow-xl shadow-primary/20"
              disabled={isLoading || !query.trim()}
            >
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Search className="h-6 w-6" />}
            </Button>
          </form>
        </section>

        <AnimatePresence mode="wait">
          {analysis ? (
            <motion.div 
              key="analysis-result"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <Card className="rounded-[3rem] border-none glass-dark lg:col-span-2 p-10 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[100px] rounded-full" />
                <CardHeader className="p-0 mb-10">
                  <div className="flex items-center justify-between">
                     <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 flex items-center gap-4">
                        <Activity className="h-5 w-5 text-accent" />
                        Commercial Performance Vector
                     </CardTitle>
                     <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
                        <Globe className="h-3 w-3 text-emerald-500" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Stochastic Modeling</span>
                     </div>
                  </div>
                </CardHeader>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analysis.performanceData}>
                      <defs>
                        <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.03} />
                      <XAxis dataKey="timestamp" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: 'rgba(255,255,255,0.2)' }} />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: '1.5rem', border: 'none', background: '#0a0a16', fontWeight: '900', fontSize: '11px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="hsl(var(--accent))" strokeWidth={4} fillOpacity={1} fill="url(#colorPulse)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-10 pt-10 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-3">
                         <Building2 className="h-4 w-4" /> Market Synthesis
                      </h4>
                      <p className="text-sm font-medium leading-relaxed text-white/70">{analysis.overview}</p>
                   </div>
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-3">
                         <Zap className="h-4 w-4" /> Commercial Utility
                      </h4>
                      <p className="text-sm font-medium leading-relaxed text-white/70">{analysis.commercialUse}</p>
                   </div>
                </div>
              </Card>

              <div className="space-y-8">
                 <Card className="rounded-[3rem] border-none glass-dark p-8 group hover:bg-white/[0.05] transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                       <ShieldCheck size={80} />
                    </div>
                    <CardHeader className="p-0 mb-6">
                       <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 flex items-center gap-4">
                          <Briefcase className="h-5 w-5 text-emerald-400" />
                          Career Resilience
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-6">
                       <p className="text-sm font-bold leading-relaxed">{analysis.jobMarketImpact}</p>
                       <div className="pt-4 border-t border-white/5">
                          <p className="text-[9px] font-black uppercase text-white/20 mb-2">Market Relevance Score</p>
                          <div className="flex items-center gap-4">
                             <div className="h-2 flex-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }} 
                                  animate={{ width: `${analysis.professionalResilienceScore}%` }} 
                                  className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                                />
                             </div>
                             <span className="text-xs font-black text-emerald-500">{analysis.professionalResilienceScore}%</span>
                          </div>
                       </div>
                    </CardContent>
                 </Card>

                 <Card className="rounded-[3rem] border-none bg-primary/20 p-8 border border-primary/20 relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="p-0 mb-6">
                       <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 flex items-center gap-4">
                          <Zap className="h-5 w-5" />
                          Sentiment Pulse
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                       <p className="text-2xl font-black italic tracking-tighter text-glow">{analysis.marketSentiment}</p>
                       <p className="text-[9px] font-black uppercase text-white/40 mt-4 tracking-widest">Aggregated News Vector: Stable</p>
                    </CardContent>
                 </Card>

                 <div className="p-8 rounded-[3rem] glass flex items-center gap-6 group hover:bg-white/[0.05] transition-all cursor-default border-white/10 shadow-3xl">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                       <TrendingUp className="h-8 w-8 text-accent" />
                    </div>
                    <div>
                       <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Volatility Index</p>
                       <p className="text-2xl font-black italic tracking-tighter">Low Hazard</p>
                    </div>
                 </div>
              </div>
            </motion.div>
          ) : (
            !isLoading && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="py-32 flex flex-col items-center justify-center text-center space-y-8"
              >
                <div className="relative">
                   <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
                   <div className="relative glass-dark p-12 rounded-full border-white/5 shadow-2xl">
                      <Globe className="h-20 w-20 text-white/10" />
                   </div>
                </div>
                <div>
                   <h3 className="text-xl font-black tracking-widest uppercase opacity-20">Awaiting Search Input</h3>
                   <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/10 mt-4">Connecting to global market matrix...</p>
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}
