
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Activity, ShieldAlert, ChevronLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function AdminPanelPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users'), limit(50));
  }, [firestore, user]);

  const { data: users, isLoading } = useCollection(usersQuery);

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-44">
      <header className="px-8 py-10 bg-[#020617]/90 backdrop-blur-3xl sticky top-0 z-50 border-b border-white/10">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" className="rounded-2xl glass h-14 w-14" asChild>
            <Link href="/dashboard"><ChevronLeft className="h-7 w-7" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight italic">Nexus Terminal</h1>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 mt-1">Global System Authority</p>
          </div>
        </div>
      </header>

      <main className="px-8 space-y-8 max-w-7xl mx-auto py-10">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[
             { label: 'Active Entities', value: users?.length || 0, icon: Users, color: 'text-primary' },
             { label: 'System Uptime', value: '99.99%', icon: Activity, color: 'text-emerald-400' },
             { label: 'Security Status', value: 'Active', icon: Lock, color: 'text-accent' }
           ].map((stat) => (
             <Card key={stat.label} className="rounded-[3rem] glass-dark border-none p-8">
               <div className="flex justify-between items-start mb-6">
                 <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">{stat.label}</p>
                 <stat.icon className={cn("h-6 w-6", stat.color)} />
               </div>
               <h3 className="text-4xl font-black italic tracking-tighter">{stat.value}</h3>
             </Card>
           ))}
        </section>

        <Card className="rounded-[3rem] glass-dark border-none p-10">
           <CardHeader className="p-0 mb-10">
              <CardTitle className="text-xl font-black italic tracking-tighter flex items-center gap-4">
                 <Users className="h-6 w-6 text-primary" />
                 Managed Entities
              </CardTitle>
           </CardHeader>
           <div className="space-y-4">
              {users?.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-6 bg-white/[0.03] rounded-[2.5rem] border border-white/5">
                   <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black">
                         {u.name?.[0] || 'U'}
                      </div>
                      <div>
                         <p className="font-black text-base">{u.name}</p>
                         <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">{u.email}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">Active</span>
                      <Button variant="ghost" size="sm" className="h-10 text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white">Profile</Button>
                   </div>
                </div>
              ))}
              {(!users || users.length === 0) && (
                <div className="py-20 text-center opacity-10 flex flex-col items-center gap-4">
                   <ShieldAlert className="h-16 w-16" />
                   <p className="font-black uppercase tracking-[0.4em] text-[10px]">No entity records found</p>
                </div>
              )}
           </div>
        </Card>
      </main>
      <BottomNav />
    </div>
  );
}
