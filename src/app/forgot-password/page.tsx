'use client';

import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Mail, Loader2, ChevronLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const { toast } = useToast();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: 'Recovery Signal Sent', description: 'Check your neural inbox for instructions.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Reset Blocked', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md z-10">
        <Card className="rounded-[2.5rem] border-none glass-dark shadow-3xl overflow-hidden relative">
          <CardHeader className="text-center space-y-4 pt-12">
            <Button variant="ghost" size="icon" className="absolute left-6 top-10 rounded-xl glass h-10 w-10" asChild>
              <Link href="/login"><ChevronLeft className="h-5 w-5" /></Link>
            </Button>
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-accent p-[1px]">
                <div className="w-full h-full bg-[#0a0a16] rounded-2xl flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-black italic tracking-tighter">Recover Key</CardTitle>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.4em]">Restore Matrix Access</p>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Neural Address</Label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <Input type="email" placeholder="name@nexus.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-14 rounded-2xl glass border-white/5 pl-14 text-sm font-bold placeholder:text-white/10" />
                </div>
              </div>
              <Button type="submit" className="w-full h-16 rounded-2xl text-xs font-black uppercase tracking-[0.3em] bg-primary shadow-xl shadow-primary/20" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Recovery Signal'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
