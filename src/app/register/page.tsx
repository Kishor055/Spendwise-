'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useAuth, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Wallet, Loader2, User, Mail, Lock, Sparkles, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      // Initialize user document
      const userRef = doc(firestore, 'users', user.uid);
      setDocumentNonBlocking(userRef, {
        id: user.uid,
        name,
        email,
        createdAt: serverTimestamp(),
      }, { merge: true });

      toast({ title: 'Nexus Initialized', description: `Welcome to SpendWise Elite, ${name}.` });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Initialization Failed',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6 relative overflow-hidden">
      {/* Background Aurora */}
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
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-primary to-accent animate-gradient-x" />
          
          <CardHeader className="text-center space-y-4 pt-12">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-accent to-primary p-[1px]">
                <div className="w-full h-full bg-[#0a0a16] rounded-2xl flex items-center justify-center shadow-2xl">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-black italic tracking-tighter">New Entity</CardTitle>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.4em]">Establish Neural Presence</p>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Entity Name</Label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <Input
                    id="name"
                    placeholder="E.g. Kishor Kakde"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-14 rounded-2xl glass border-white/5 pl-14 text-sm font-bold placeholder:text-white/10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Neural Address</Label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@nexus.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-14 rounded-2xl glass border-white/5 pl-14 text-sm font-bold placeholder:text-white/10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Access Key</Label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-14 rounded-2xl glass border-white/5 pl-14 text-sm font-bold"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-16 rounded-2xl text-xs font-black uppercase tracking-[0.3em] bg-accent text-accent-foreground hover:bg-accent/80 shadow-xl shadow-accent/20 group transition-all" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <>
                    Establish Nexus
                    <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <div className="p-8 pt-0 text-center">
            <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">
              Already registered?{' '}
              <Link href="/login" className="text-accent hover:text-primary transition-colors">
                Resume Session
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
