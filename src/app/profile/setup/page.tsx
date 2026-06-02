'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from 'firebase/auth';
import { useUser, useFirestore, useDoc, setDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Phone, Wallet, Loader2, Sparkles, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export default function ProfileSetupPage() {
  const { user } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [budget, setBudget] = useState('50000');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.displayName || '');
      setPhone(user.phoneNumber || '');
    }
  }, [user]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      await updateProfile(user, { displayName: name });
      
      const userRef = doc(firestore, 'users', user.uid);
      setDocumentNonBlocking(userRef, {
        name,
        phone,
        monthlyBudget: parseFloat(budget),
        onboarded: true,
        updatedAt: serverTimestamp()
      }, { merge: true });

      toast({ title: 'Profile Synchronized', description: 'Your neural profile is now active.' });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Setup Failed', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[60%] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl z-10">
        <Card className="rounded-[3rem] border-none glass-dark shadow-3xl relative overflow-hidden">
          <CardHeader className="text-center pt-12 space-y-6">
            <div className="relative inline-block mx-auto">
              <Avatar className="w-24 h-24 border-4 border-primary/20 p-1">
                <AvatarImage src={user?.photoURL || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-black">{name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-4 border-[#0a0a16]">
                <Check className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-black italic tracking-tighter">Identity Setup</CardTitle>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.4em]">Finalize Neural Parameters</p>
            </div>
          </CardHeader>

          <CardContent className="p-10">
            <form onSubmit={handleSetup} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <Input value={name} onChange={(e) => setName(e.target.value)} required className="h-14 rounded-2xl glass border-white/5 pl-14 font-bold" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Phone Link</Label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} required className="h-14 rounded-2xl glass border-white/5 pl-14 font-bold" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Monthly Budget (₹)</Label>
                <div className="relative">
                  <Wallet className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} required className="h-14 rounded-2xl glass border-white/5 pl-14 font-bold text-lg" />
                </div>
              </div>

              <Button type="submit" className="w-full h-16 rounded-[2rem] bg-primary text-white font-black uppercase tracking-[0.3em] shadow-2xl shadow-primary/20" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Activate Matrix Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
