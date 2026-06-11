
"use client";

import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  LogOut, 
  Settings, 
  Bell, 
  Shield, 
  HelpCircle, 
  ChevronRight, 
  Wallet, 
  BrainCircuit,
  Trophy,
  Zap,
  Star,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profile } = useDoc(userDocRef);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const menuItems = [
    { icon: Settings, label: 'Neural Configuration', color: 'text-primary bg-primary/10' },
    { icon: Bell, label: 'Matrix Notifications', color: 'text-accent bg-accent/10' },
    { icon: Shield, label: 'Encryption Protocol', color: 'text-emerald-500 bg-emerald-500/10' },
    { icon: Star, label: 'SaaS Marketplace', color: 'text-orange-500 bg-orange-500/10' },
    { icon: HelpCircle, label: 'Nexus Support', color: 'text-white/40 bg-white/5' },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-44 selection:bg-primary/30">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/5 blur-[150px] rounded-full" />
      </div>

      <header className="px-8 pt-24 pb-16 flex flex-col items-center gap-10 relative z-10">
        <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-tr from-primary to-accent rounded-full blur-2xl opacity-30 group-hover:opacity-60 transition duration-1000"></div>
          <Avatar className="w-40 h-40 border-8 border-[#020617] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] relative z-10">
            <AvatarImage src={user?.photoURL || ''} />
            <AvatarFallback className="bg-gradient-to-tr from-primary to-accent text-white text-5xl font-black italic">
              {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-2 -right-2 bg-emerald-500 h-10 w-10 rounded-2xl flex items-center justify-center border-4 border-[#020617] z-20 shadow-xl">
             <ShieldCheck className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-black tracking-tighter italic">{user?.displayName || 'Identity Unknown'}</h1>
          <div className="flex items-center justify-center gap-4">
             <span className="text-[10px] text-white/30 font-black uppercase tracking-[0.4em]">{user?.email}</span>
             <span className="h-1 w-1 rounded-full bg-white/10" />
             <span className="text-[10px] text-primary font-black uppercase tracking-widest">{profile?.rank || 'Novice'} Authority</span>
          </div>
        </div>
      </header>

      <main className="px-8 space-y-10 max-w-4xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Card className="rounded-[3rem] overflow-hidden border-none glass p-10 relative group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                 <Trophy className="h-12 w-12 text-primary" />
              </div>
              <div className="space-y-6">
                 <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30">Active Streak</p>
                 <div className="flex items-end gap-3">
                    <h3 className="text-5xl font-black italic tracking-tighter text-glow">{profile?.streak || 12}</h3>
                    <p className="text-xs font-black text-white/40 mb-2 uppercase">Days</p>
                 </div>
              </div>
           </Card>

           <Card className="rounded-[3rem] overflow-hidden border-none glass p-10 relative group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                 <Zap className="h-12 w-12 text-accent" />
              </div>
              <div className="space-y-6">
                 <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30">Neural Level</p>
                 <div className="flex items-end gap-3">
                    <h3 className="text-5xl font-black italic tracking-tighter accent-glow">Lvl 42</h3>
                    <p className="text-xs font-black text-white/40 mb-2 uppercase">Strategist</p>
                 </div>
              </div>
           </Card>
        </div>

        <Card className="rounded-[3.5rem] overflow-hidden border-none glass shadow-3xl relative group">
          <div className="absolute top-0 right-0 p-10">
             <div className="w-14 h-14 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-primary/20 transition-colors">
                <BrainCircuit className="h-7 w-7 text-primary" />
             </div>
          </div>
          <CardHeader className="p-12 pb-6">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 flex items-center gap-4">
              <Wallet className="h-5 w-5" />
              Manifestation Tier
            </CardTitle>
          </CardHeader>
          <CardContent className="p-12 pt-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
              <div>
                <p className="font-black text-3xl italic tracking-tighter">SpendWise Elite Tier</p>
                <p className="text-sm text-white/40 font-medium mt-2 max-w-xs leading-relaxed">Unlock Quantum Forecasting and Shared Family Wallets with Elite Status.</p>
              </div>
              <Button size="lg" className="rounded-[2rem] bg-primary hover:bg-primary/80 shadow-2xl shadow-primary/30 h-16 px-12 font-black text-[10px] uppercase tracking-[0.3em] transition-all active:scale-95">Upgrade Protocol</Button>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 px-8">Nexus Configuration</p>
          <div className="space-y-4">
            {menuItems.map((item, i) => (
              <motion.button 
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="w-full flex items-center justify-between p-8 bg-white/[0.03] border border-white/[0.05] rounded-[2.5rem] hover:bg-white/[0.06] hover:border-white/10 transition-all group"
              >
                <div className="flex items-center gap-8">
                  <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center border border-white/5 transition-transform group-hover:scale-110", item.color)}>
                    <item.icon className="h-8 w-8" />
                  </div>
                  <span className="font-black text-xl text-white/90 group-hover:text-white transition-colors">{item.label}</span>
                </div>
                <ChevronRight className="h-7 w-7 text-white/10 group-hover:text-white transition-all transform group-hover:translate-x-2" />
              </motion.button>
            ))}
          </div>
        </section>

        <div className="pt-10 space-y-6">
          <Button 
            variant="destructive" 
            className="w-full h-24 rounded-[3rem] text-xs font-black uppercase tracking-[0.5em] shadow-3xl shadow-rose-900/30 bg-rose-950/20 text-rose-500 border border-rose-500/10 hover:bg-rose-950/40 transition-all group overflow-hidden relative"
            onClick={handleLogout}
          >
            <div className="relative z-10 flex items-center justify-center">
              <LogOut className="mr-4 h-6 w-6 group-hover:translate-x-[-4px] transition-transform" />
              Terminate Neural Session
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500/0 via-rose-500/5 to-rose-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
          
          <div className="text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.8em] text-white/10">SpendWise Core v3.0.42-Elite</p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

