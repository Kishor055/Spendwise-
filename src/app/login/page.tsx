'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Loader2, Mail, Lock, Sparkles, ChevronRight, Phone, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {}
      });
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: error.message || 'Invalid credentials in the matrix.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setVerificationId(confirmationResult);
      toast({ title: 'OTP Sent', description: 'Verification signal transmitted.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Signal Blocked', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verificationId.confirm(otp);
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Invalid Signal', description: 'OTP mismatch detected.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Neural Link Failed', description: error.message });
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6 relative overflow-hidden">
      <div id="recaptcha-container"></div>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 blur-[150px] rounded-full" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md z-10">
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
              <CardTitle className="text-3xl font-black italic tracking-tighter">Access Matrix</CardTitle>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.4em]">Initialize Connection</p>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 glass rounded-2xl p-1 h-12">
                <TabsTrigger value="email" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary">Neural Key</TabsTrigger>
                <TabsTrigger value="phone" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary">OTP Link</TabsTrigger>
              </TabsList>

              <TabsContent value="email">
                <form onSubmit={handleEmailLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                      <Input type="email" placeholder="name@nexus.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-14 rounded-2xl glass border-white/5 pl-14 text-sm font-bold placeholder:text-white/10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Key</Label>
                      <Link href="/forgot-password" size="sm" className="text-[9px] text-primary hover:text-accent font-black uppercase tracking-widest transition-colors">Lost?</Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                      <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-14 rounded-2xl glass border-white/5 pl-14 text-sm font-bold" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-16 rounded-2xl text-xs font-black uppercase tracking-[0.3em] bg-primary hover:bg-primary/80 shadow-xl shadow-primary/20 group transition-all" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Resume Session <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></>}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="phone">
                {!verificationId ? (
                  <form onSubmit={handlePhoneLogin} className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Phone Matrix</Label>
                      <div className="relative">
                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                        <Input type="tel" placeholder="9876543210" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required className="h-14 rounded-2xl glass border-white/5 pl-14 text-sm font-bold placeholder:text-white/10" />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-16 rounded-2xl text-xs font-black uppercase tracking-[0.3em] bg-primary hover:bg-primary/80 shadow-xl shadow-primary/20 group transition-all" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send Signal <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></>}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Verification Signal</Label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                        <Input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required className="h-14 rounded-2xl glass border-white/5 pl-14 text-sm font-bold placeholder:text-white/10" />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-16 rounded-2xl text-xs font-black uppercase tracking-[0.3em] bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 group transition-all" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Confirm Link <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></>}
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>

            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5"></span></div>
              <div className="relative flex justify-center text-[8px] uppercase font-black tracking-[0.4em]"><span className="bg-[#0a0a16] px-4 text-white/20">Bridge</span></div>
            </div>

            <Button variant="ghost" className="w-full h-14 rounded-2xl glass border-white/5 font-black text-[10px] uppercase tracking-widest flex gap-3 hover:bg-white/5" onClick={handleGoogleLogin}>
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Neural Sync
            </Button>
          </CardContent>

          <div className="p-8 pt-0 text-center">
            <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">New Entity? <Link href="/register" className="text-primary hover:text-accent transition-colors">Initialize Account</Link></p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
