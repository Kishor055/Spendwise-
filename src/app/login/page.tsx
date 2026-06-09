'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInAnonymously, updateProfile } from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Wallet, Loader2, User, Mail, ChevronRight, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSimpleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    
    setLoading(true);
    try {
      // Create a valid Firebase session anonymously (Simple Identity Mode)
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;

      // Update the Auth Profile
      await updateProfile(user, { displayName: name });

      // Initialize/Update the Firestore User Record
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, {
        id: user.uid,
        name,
        email,
        onboarded: true,
        rank: 'Elite',
        currency: 'INR',
        monthlyBudget: 50000,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
      }, { merge: true });

      toast({ 
        title: 'Neural Link Established', 
        description: `Identity verified. Welcome back, ${name}.` 
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Auth Error:', error);
      toast({
        variant: 'destructive',
        title: 'Neural Link Error',
        description: 'Failed to establish connection. Ensure identity parameters are correct.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 blur-[150px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-md z-10"
      >
        <Card className="rounded-[2.5rem] border-none glass-dark shadow-3xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x" />
          
          <CardHeader className="text-center space-y-4 pt-12">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-accent p-[1px]">
                <div className="w-full h-full bg-[#0a0a16] rounded-2xl flex items-center justify-center shadow-2xl">
                  <Wallet className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-black italic tracking-tighter">Identity Portal</CardTitle>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.4em]">Neural Login v4.0</p>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSimpleLogin} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <Input 
                      placeholder="E.g. Kishor Kakde" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required 
                      suppressHydrationWarning
                      className="h-14 rounded-2xl glass border-white/5 pl-14 text-sm font-bold placeholder:text-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Neural Address (Email)</Label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <Input 
                      type="email" 
                      placeholder="name@nexus.com" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                      suppressHydrationWarning
                      className="h-14 rounded-2xl glass border-white/5 pl-14 text-sm font-bold placeholder:text-white/10"
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-16 rounded-2xl text-xs font-black uppercase tracking-[0.3em] bg-primary hover:bg-primary/80 shadow-xl shadow-primary/20 group transition-all" 
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>Enter the Matrix <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
            </form>

            <div className="mt-10 pt-10 border-t border-white/5 text-center">
              <div className="inline-flex items-center gap-2 text-accent/40 bg-accent/5 px-4 py-2 rounded-full border border-accent/10">
                <Sparkles className="h-3 w-3" />
                <span className="text-[8px] font-black uppercase tracking-widest">Quantum Identity Encryption</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
