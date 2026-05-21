"use client";

import { useUser, useAuth } from '@/firebase';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Settings, Bell, Shield, HelpCircle, ChevronRight, Wallet, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const menuItems = [
    { icon: Settings, label: 'Neural Settings', color: 'text-primary bg-primary/10' },
    { icon: Bell, label: 'Matrix Alerts', color: 'text-accent bg-accent/10' },
    { icon: Shield, label: 'Encryption Protocol', color: 'text-[#43A047] bg-[#43A047]/10' },
    { icon: HelpCircle, label: 'System Support', color: 'text-white/40 bg-white/5' },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-44">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[150px] rounded-full" />
      </div>

      <header className="px-8 pt-20 pb-12 flex flex-col items-center gap-6 relative z-10">
        <div className="relative group">
          <div className="absolute -inset-2 bg-gradient-to-tr from-primary to-accent rounded-full blur opacity-40 group-hover:opacity-70 transition duration-1000"></div>
          <Avatar className="w-32 h-32 border-4 border-[#020617] shadow-3xl relative z-10">
            <AvatarImage src={user?.photoURL || ''} />
            <AvatarFallback className="bg-gradient-to-tr from-primary to-accent text-white text-4xl font-black italic">
              {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black tracking-tighter italic">{user?.displayName || 'Spendwise Elite'}</h1>
          <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.5em]">{user?.email}</p>
        </div>
      </header>

      <main className="px-8 space-y-8 max-w-4xl mx-auto relative z-10">
        <Card className="rounded-[3rem] overflow-hidden border-none glass shadow-3xl relative group">
          <div className="absolute top-0 right-0 p-8">
             <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                <BrainCircuit className="h-6 w-6 text-primary" />
             </div>
          </div>
          <CardHeader className="p-10 pb-4">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 flex items-center gap-3">
              <Wallet className="h-4 w-4" />
              Identity Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-2xl italic tracking-tight">SpendWise Elite Tier</p>
                <p className="text-xs text-white/40 font-medium mt-1">Quantum features initialized</p>
              </div>
              <Button size="sm" className="rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 h-12 px-8 font-black text-[10px] uppercase tracking-widest">Upgrade</Button>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 px-4">System Configuration</p>
          <div className="space-y-3">
            {menuItems.map((item) => (
              <button 
                key={item.label}
                className="w-full flex items-center justify-between p-6 bg-white/[0.03] border border-white/[0.05] rounded-[2rem] hover:bg-white/[0.06] transition-all group"
              >
                <div className="flex items-center gap-6">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border border-white/5", item.color)}>
                    <item.icon className="h-7 w-7" />
                  </div>
                  <span className="font-black text-lg text-white/80">{item.label}</span>
                </div>
                <ChevronRight className="h-6 w-6 text-white/20 group-hover:text-white transition-all" />
              </button>
            ))}
          </div>
        </section>

        <Button 
          variant="destructive" 
          className="w-full h-20 rounded-[2.5rem] text-sm font-black uppercase tracking-[0.4em] shadow-3xl shadow-rose-900/20 bg-rose-900/20 text-rose-500 border border-rose-500/20 hover:bg-rose-900/40 transition-all mb-10"
          onClick={handleLogout}
        >
          <LogOut className="mr-4 h-6 w-6" />
          Terminate Session
        </Button>
      </main>

      <BottomNav />
    </div>
  );
}
