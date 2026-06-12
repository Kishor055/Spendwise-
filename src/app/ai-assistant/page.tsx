'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { askFinancialAdvisor } from '@/ai/flows/financial-advisor-flow';
import { scanReceipt } from '@/ai/flows/receipt-scanner-flow';
import { processVoiceIntent } from '@/ai/flows/voice-intent-flow';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  ChevronLeft, 
  Briefcase, 
  ShoppingCart,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Mic,
  FileText,
  Zap,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking } from '@/firebase';
import { serverTimestamp, Timestamp } from 'firebase/firestore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  strategicInfo?: {
    action: string;
    rating: number;
    marketCorrelation: string;
  };
  purchaseAdvice?: {
    decision: 'BUY' | 'WAIT' | 'AVOID';
    reasoning: string;
    budgetImpact: number;
    goalDelay: string;
    alternative: string;
  };
  scanResult?: {
    merchant: string;
    amount: number;
    taxAmount?: number;
    category: string;
    date: string;
    items?: Array<{ name: string; price: number; quantity?: number }>;
    confidence: number;
  };
}

const SUGGESTIONS = [
  { label: "Scan Receipt", icon: FileText, action: 'scan' },
  { label: "Voice Log", icon: Mic, action: 'voice' },
  { label: "Should I buy...", icon: ShoppingCart, isSpecial: true },
  { label: "Job Market Readiness", icon: Briefcase },
];

export default function AIAssistantPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Nexus Intelligence Hub active. Scan receipts or speak to log transactions. I can also simulate purchase impact on your net worth." }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc'), limit(50));
  }, [firestore, user]);

  const budgetsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'budgets'));
  }, [firestore, user]);

  const goalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'goals'));
  }, [firestore, user]);

  const { data: transactions } = useCollection(transactionsQuery);
  const { data: budgets } = useCollection(budgetsQuery);
  const { data: goals } = useCollection(goalsQuery);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !firestore) return;

    setIsTyping(true);
    setMessages(prev => [...prev, { role: 'user', content: "Initializing Vision OCR Protocol..." }]);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const response = await scanReceipt({ imageUri: base64String });
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Vision scan complete. I've extracted ${response.merchant} with ${Math.round(response.confidence * 100)}% confidence. Sector mapped: ${response.category}.`,
          scanResult: response
        }]);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Neural Link Error', description: 'OCR pipeline failed to resolve the image.' });
    } finally {
      setIsTyping(false);
    }
  };

  const syncToLedger = async (result: any) => {
    if (!user || !firestore) return;
    const colRef = collection(firestore, 'users', user.uid, 'transactions');
    addDocumentNonBlocking(colRef, {
      amount: result.amount,
      type: 'expense',
      category: result.category,
      merchant: result.merchant,
      date: Timestamp.fromDate(new Date(result.date)),
      createdAt: serverTimestamp(),
      userId: user.uid,
      note: 'AI Scanned: ' + (result.taxAmount ? `Incl. ₹${result.taxAmount} GST` : 'Receipt Scan')
    });
    toast({ title: 'Protocol Executed', description: 'Transaction manifest synchronized with universal history.' });
  };

  const handleSend = async (customMessage?: string) => {
    const messageToSend = customMessage || input;
    if (!messageToSend.trim() || isTyping || !user) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: messageToSend }]);
    setIsTyping(true);

    try {
      const response = await askFinancialAdvisor({
        query: messageToSend,
        transactions: (transactions || []).map(t => ({
          amount: t.amount,
          type: t.type,
          category: t.category,
          date: t.date?.seconds ? new Date(t.date.seconds * 1000).toISOString() : new Date().toISOString(),
          note: t.note
        })),
        budgets: (budgets || []).map(b => ({ category: b.category, limit: b.limit })),
        goals: (goals || []).map(g => ({ title: g.title, targetAmount: g.targetAmount, currentAmount: g.currentAmount })),
        userProfile: {
          name: user.displayName || 'Entity',
          monthlyBudget: 50000,
          rank: 'Elite'
        }
      });

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.answer,
        strategicInfo: {
          action: response.strategicAction,
          rating: response.efficiencyRating,
          marketCorrelation: response.marketCorrelation
        }
      }]);
    } catch (error) {
      console.error('Advisor Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Neural link interrupted." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-44 bg-[#020617] text-white overflow-hidden">
      <header className="px-8 py-8 bg-[#020617]/60 backdrop-blur-3xl sticky top-0 z-50 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" className="rounded-2xl glass h-14 w-14 hover:bg-white/10" asChild>
            <Link href="/dashboard"><ChevronLeft className="h-7 w-7" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black flex items-center gap-4 italic text-glow">
              <Sparkles className="h-8 w-8 text-primary" />
              AI Co-Pilot
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
           <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
           <Button variant="ghost" size="icon" className="glass h-12 w-12 rounded-2xl" onClick={() => fileInputRef.current?.click()}>
              <FileText className="h-5 w-5 text-accent" />
           </Button>
           <Button variant="ghost" size="icon" className="glass h-12 w-12 rounded-2xl" onClick={() => setIsRecording(!isRecording)}>
              <Mic className={cn("h-5 w-5", isRecording ? "text-rose-500 animate-pulse" : "text-primary")} />
           </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-12 space-y-12 scrollbar-hide relative z-10" ref={scrollRef}>
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex flex-col w-full gap-4", msg.role === 'user' ? "items-end" : "items-start")}
            >
              <div className={cn(
                "max-w-[85%] p-8 rounded-[2.5rem] shadow-2xl relative",
                msg.role === 'user' 
                  ? "bg-primary text-white rounded-tr-none border border-white/20" 
                  : "glass rounded-tl-none border-white/10"
              )}>
                <p className="text-base font-bold leading-relaxed tracking-tight text-white/90">{msg.content}</p>
                
                {msg.scanResult && (
                  <div className="mt-6 p-6 bg-white/5 rounded-3xl border border-white/10 space-y-6">
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                           <Zap className="h-4 w-4 text-accent" />
                           <span className="text-[10px] font-black uppercase text-accent tracking-widest">Quantum Vision Analysis</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                           <Check className="h-3 w-3 text-emerald-500" />
                           <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">{Math.round(msg.scanResult.confidence * 100)}% Match</span>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-8">
                        <div>
                           <p className="text-[8px] font-black uppercase text-white/20 tracking-[0.2em] mb-1">Entity</p>
                           <p className="font-black text-lg">{msg.scanResult.merchant}</p>
                        </div>
                        <div>
                           <p className="text-[8px] font-black uppercase text-white/20 tracking-[0.2em] mb-1">Total Vector</p>
                           <p className="font-black text-lg italic text-primary">₹{msg.scanResult.amount.toLocaleString()}</p>
                        </div>
                        {msg.scanResult.taxAmount && (
                          <div className="col-span-2 pt-4 border-t border-white/5 flex justify-between">
                             <span className="text-[9px] font-black uppercase text-white/30">Tax Vector (GST)</span>
                             <span className="text-[10px] font-black text-accent">₹{msg.scanResult.taxAmount}</span>
                          </div>
                        )}
                        <div className="col-span-2">
                           <p className="text-[8px] font-black uppercase text-white/20 tracking-[0.2em] mb-1">Temporal Data</p>
                           <p className="text-sm font-bold text-white/60">{msg.scanResult.date}</p>
                        </div>
                     </div>

                     <Button 
                        className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20" 
                        onClick={() => syncToLedger(msg.scanResult)}
                      >
                        Synchronize with Ledger
                      </Button>
                  </div>
                )}

                {msg.strategicInfo && (
                  <div className="mt-8 p-6 glass-dark rounded-[2rem] border-white/10 space-y-6">
                    <div className="flex items-center justify-between">
                       <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Strategic Pulse</h4>
                       <span className="text-lg font-black italic text-primary">{msg.strategicInfo.rating}/100</span>
                    </div>
                    <div className="space-y-4">
                       <div>
                          <p className="text-[8px] font-black uppercase text-white/20 mb-1">Commercial Action</p>
                          <p className="text-xs font-bold leading-relaxed">{msg.strategicInfo.action}</p>
                       </div>
                       <div>
                          <p className="text-[8px] font-black uppercase text-white/20 mb-1">Market Readiness</p>
                          <p className="text-[11px] font-medium leading-relaxed text-white/60">{msg.strategicInfo.marketCorrelation}</p>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="glass p-6 rounded-[2.5rem] rounded-tl-none border-white/10 flex items-center gap-4">
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
              <span className="text-[10px] font-black text-accent uppercase tracking-[0.4em]">Processing Intelligence...</span>
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-32 left-0 right-0 p-8 z-40">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {SUGGESTIONS.map((s) => (
              <Button 
                key={s.label} 
                variant="outline" 
                className={cn(
                  "whitespace-nowrap rounded-2xl glass border-white/10 text-[10px] font-black uppercase tracking-widest h-12 px-6 hover:bg-white/10",
                  s.isSpecial && "border-primary/40 bg-primary/5 text-primary"
                )}
                onClick={() => {
                  if (s.action === 'scan') fileInputRef.current?.click();
                  else handleSend(s.label);
                }}
              >
                <s.icon className="h-4 w-4 mr-3" />
                {s.label}
              </Button>
            ))}
          </div>
          <div className="relative flex items-center">
            <Input 
              placeholder={isRecording ? "Listening to your pulse..." : "Query the financial matrix..."}
              className="h-20 rounded-[2.5rem] glass border-white/10 shadow-3xl text-lg font-bold placeholder:text-white/20 px-10 pr-24"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button 
              size="icon" 
              className="absolute right-4 h-14 w-14 rounded-[1.5rem] bg-primary hover:bg-primary/80"
              onClick={() => handleSend()}
              disabled={isTyping || !input.trim()}
            >
              <Send className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
