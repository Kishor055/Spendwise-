
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Users, 
  Activity, 
  ShieldAlert, 
  ChevronLeft, 
  Lock, 
  Globe, 
  Cpu, 
  Database,
  BarChart3,
  Server
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function AdminPanelPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'), limit(50));
  }, [firestore, user]);

  const { data: users, isLoading } = useCollection(usersQuery);

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-44 selection:bg-primary/30">
      <header className="px-8 py-10 bg-[#020617]/90 backdrop-blur-3xl sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" className="rounded-2xl glass h-14 w-14" asChild>
              <Link href="/dashboard"><ChevronLeft className="h-7 w-7" /></Link>
            </Button>
            <div>
              <h1 className="text-2xl font-black tracking-tighter italic">Nexus Terminal</h1>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 mt-1">Global System Authority</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-500">System Nominal</span>
          </div>
        </div>
      </header>

      <main className="px-8 space-y-12 max-w-7xl mx-auto py-12 relative z-10">
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           {[
             { label: 'Managed Entities', value: users?.length || 0, icon: Users, color: 'text-primary' },
             { label: 'Neural Uptime', value: '99.99%', icon: Activity, color: 'text-emerald-400' },
             { label: 'Security Protocols', value: 'Level 4', icon: Lock, color: 'text-accent' },
             { label: 'Global Latency', value: '14ms', icon: Globe, color: 'text-rose-400' }
           ].map((stat, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: i * 0.1 }}
             >
               <Card className="rounded-[3rem] glass-dark border-none p-10 hover:bg-white/[0.05] transition-all group overflow-hidden relative">
                 <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                    <stat.icon size={100} />
                 </div>
                 <div className="relative z-10 space-y-6">
                   <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">{stat.label}</p>
                   <h3 className="text-5xl font-black italic tracking-tighter">{stat.value}</h3>
                 </div>
               </Card>
             </motion.div>
           ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Card className="rounded-[3.5rem] glass-dark border-none p-12 lg:col-span-2 relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-5">
                 <Database className="h-32 w-32" />
              </div>
              <div className="flex justify-between items-center mb-12">
                 <h2 className="text-xl font-black italic flex items-center gap-4">
                    <Users className="h-6 w-6 text-primary" />
                    Entity Registry
                 </h2>
                 <Button variant="ghost" className="text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white">Export Matrix</Button>
              </div>
              <div className="space-y-4">
                 {users?.map((u, i) => (
                   <div key={u.id} className="flex items-center justify-between p-8 bg-white/[0.02] rounded-[2.5rem] border border-white/5 hover:bg-white/[0.05] transition-all">
                      <div className="flex items-center gap-6">
                         <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl border border-primary/20">
                            {u.name?.[0] || 'U'}
                         </div>
                         <div>
                            <p className="font-black text-xl tracking-tight">{u.name}</p>
                            <div className="flex items-center gap-3 mt-1">
                               <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">{u.email}</p>
                               <span className="h-1 w-1 rounded-full bg-white/10" />
                               <p className="text-[10px] text-accent font-black uppercase tracking-widest">{u.rank || 'Novice'}</p>
                            </div>
                         </div>
                      </div>
                      <div className="flex items-center gap-6">
                         <div className="text-right hidden sm:block">
                            <p className="text-[8px] font-black uppercase text-white/20 tracking-widest">Active Since</p>
                            <p className="font-bold text-xs">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Live'}</p>
                         </div>
                         <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 hover:bg-primary/20 hover:text-primary transition-all">
                            <BarChart3 className="h-5 w-5" />
                         </Button>
                      </div>
                   </div>
                 ))}
                 {(!users || users.length === 0) && !isLoading && (
                   <div className="py-24 text-center opacity-10 flex flex-col items-center gap-6">
                      <ShieldAlert className="h-20 w-20" />
                      <p className="font-black uppercase tracking-[0.5em] text-[10px]">No Neural Records Found</p>
                   </div>
                 )}
              </div>
           </Card>

           <div className="space-y-8">
              <Card className="rounded-[3.5rem] glass-dark border-none p-10 space-y-10 border border-white/5">
                 <h2 className="text-xs font-black uppercase tracking-[0.4em] text-accent flex items-center gap-3">
                    <Server className="h-5 w-5" /> System Health
                 </h2>
                 <div className="space-y-8">
                    {[
                      { label: 'CPU Cluster', val: 12, color: 'bg-primary' },
                      { label: 'Neural Memory', val: 84, color: 'bg-accent' },
                      { label: 'Storage Sync', val: 45, color: 'bg-emerald-500' }
                    ].map((m) => (
                      <div key={m.label} className="space-y-3">
                         <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                            <span className="text-white/40">{m.label}</span>
                            <span>{m.val}%</span>
                         </div>
                         <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full transition-all duration-1000", m.color)} style={{ width: `${m.val}%` }} />
                         </div>
                      </div>
                    ))}
                 </div>
              </Card>

              <Card className="rounded-[3.5rem] glass border-none p-10 bg-primary/20 relative overflow-hidden group">
                 <Cpu className="h-16 w-16 text-primary absolute -bottom-4 -right-4 opacity-20 group-hover:scale-110 transition-transform" />
                 <h2 className="text-xs font-black uppercase tracking-[0.4em] text-white/60 mb-6">Security Engine</h2>
                 <p className="text-lg font-black italic tracking-tighter leading-tight">Quantum Identity Encryption Active.</p>
                 <Button className="mt-8 w-full h-12 rounded-2xl bg-white text-primary font-black uppercase text-[10px] tracking-widest">Re-Key System</Button>
              </Card>
           </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

