
'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { askFinancialAdvisor } from '@/ai/flows/financial-advisor-flow';
import { scanReceipt } from '@/ai/flows/receipt-scanner-flow';
import { advisePurchase } from '@/ai/flows/purchase-advisor-flow';
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
  Check,
  BrainCircuit,
  Calculator,
  ArrowRight
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
  { label: "Can I afford...", icon: Calculator, action: 'purchase' },
  { label: "Career Burn Rate", icon: Briefcase },
  { label: "Subscription Leak", icon: Zap },
];

export default function AIAssistantPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Nexus Intelligence Hub active. Scan receipts or speaking to log. I can also simulate purchase impact on your manifestations." }
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
    setMessages(prev => [...prev, { role: 'user', content: "Executing Vision OCR Protocol..." }]);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const response = await scanReceipt({ imageUri: base64String });
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Vision scan complete. Identified ${response.merchant} with ${Math.round(response.confidence * 100)}% accuracy. Sector: ${response.category}.`,
          scanResult: response
        }]);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Neural Link Error', description: 'OCR pipeline failure.' });
    } finally {
      setIsTyping(false);
    }
  };

  const handlePurchaseAdvisor = async (queryText: string) => {
    if (!user || !transactions) return;
    setIsTyping(true);
    
    // Extract name/price from common patterns: "Can I afford MacBook for 200000"
    const priceMatch = queryText.match(/(\d+)/);
    const price = priceMatch ? parseFloat(priceMatch[0]) : 10000;
    const itemName = queryText.replace(/Can I afford|for|buy/gi, '').trim() || 'this acquisition';

    try {
      const response = await advisePurchase({
        itemName,
        price,
        transactions: (transactions || []).map(t => ({ amount: t.amount, type: t.type, category: t.category })),
        budgets: (budgets || []).map(b => ({ category: b.category, limit: b.limit })),
        goals: (goals || []).map(g => ({ title: g.title, targetAmount: g.targetAmount, currentAmount: g.currentAmount }))
      });

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Analyzing acquisition strategy for "${itemName}"...`,
        purchaseAdvice: response
      }]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async (customMessage?: string) => {
    const messageToSend = customMessage || input;
    if (!messageToSend.trim() || isTyping || !user) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: messageToSend }]);
    setIsTyping(true);

    if (messageToSend.toLowerCase().includes('afford') || messageToSend.toLowerCase().includes('buy')) {
       return handlePurchaseAdvisor(messageToSend);
    }

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
      setMessages(prev => [...prev, { role: 'assistant', content: "Neural path interrupted." }]);
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
      note: 'AI Vision Extracted: ' + (result.taxAmount ? `Incl. ₹${result.taxAmount} Tax` : 'Receipt Scan')
    });
    toast({ title: 'Protocol Executed', description: 'Transaction manifest synchronized.' });
  };

  return (
    <div className="min-h-screen flex flex-col pb-44 bg-[#020617] text-white overflow-hidden selection:bg-primary/30">
      <header className="px-8 py-8 bg-[#020617]/60 backdrop-blur-3xl sticky top-0 z-50 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" className="rounded-2xl glass h-14 w-14 hover:bg-white/10" asChild>
            <Link href="/dashboard"><ChevronLeft className="h-7 w-7" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black flex items-center gap-4 italic tracking-tighter">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
              Nexus Hub
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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={cn("flex flex-col w-full gap-4", msg.role === 'user' ? "items-end" : "items-start")}
            >
              <div className={cn(
                "max-w-[90%] p-8 rounded-[3rem] shadow-3xl relative",
                msg.role === 'user' 
                  ? "bg-primary text-white rounded-tr-none border border-white/20" 
                  : "glass rounded-tl-none border-white/10"
              )}>
                <p className="text-base font-bold leading-relaxed tracking-tight text-white/90">{msg.content}</p>
                
                {msg.purchaseAdvice && (
                  <div className="mt-8 p-8 bg-white/[0.03] rounded-[2.5rem] border border-white/10 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <BrainCircuit className="h-6 w-6 text-accent" />
                           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Simulation Decision</span>
                        </div>
                        <div className={cn(
                          "px-6 py-2 rounded-full border font-black uppercase text-[10px] tracking-widest",
                          msg.purchaseAdvice.decision === 'BUY' ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-500" :
                          msg.purchaseAdvice.decision === 'WAIT' ? "bg-orange-500/10 border-orange-500/40 text-orange-500" :
                          "bg-rose-500/10 border-rose-500/40 text-rose-500"
                        )}>
                           {msg.purchaseAdvice.decision} PROTOCOL
                        </div>
                     </div>
                     
                     <div className="space-y-4">
                        <p className="text-xl font-black italic leading-tight">{msg.purchaseAdvice.reasoning}</p>
                        <div className="grid grid-cols-2 gap-6">
                           <div>
                              <p className="text-[8px] font-black uppercase text-white/20 tracking-widest mb-1">Budget Impact</p>
                              <div className="flex items-center gap-3">
                                 <Progress value={msg.purchaseAdvice.budgetImpact} className="h-2 flex-1" indicatorClassName={msg.purchaseAdvice.budgetImpact > 50 ? "bg-rose-500" : "bg-accent"} />
                                 <span className="text-[10px] font-black">{msg.purchaseAdvice.budgetImpact}%</span>
                              </div>
                           </div>
                           <div>
                              <p className="text-[8px] font-black uppercase text-white/20 tracking-widest mb-1">Goal Delay</p>
                              <p className="text-sm font-black text-white/60">{msg.purchaseAdvice.goalDelay}</p>
                           </div>
                        </div>
                     </div>

                     <div className="p-6 bg-accent/5 rounded-3xl border border-accent/10">
                        <p className="text-[8px] font-black uppercase text-accent tracking-widest mb-2 flex items-center gap-2">
                           <Zap className="h-3 w-3" /> Alternative Protocol
                        </p>
                        <p className="text-xs font-bold leading-relaxed">{msg.purchaseAdvice.alternative}</p>
                     </div>
                  </div>
                )}

                {msg.scanResult && (
                  <div className="mt-8 p-8 bg-white/[0.03] rounded-[2.5rem] border border-white/10 space-y-8">
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <Zap className="h-5 w-5 text-accent animate-pulse" />
                           <span className="text-[10px] font-black uppercase text-accent tracking-[0.4em]">Quantum Vector Match</span>
                        </div>
                        <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20 uppercase tracking-widest">
                           {Math.round(msg.scanResult.confidence * 100)}% Confidence
                        </span>
                     </div>
                     <div className="grid grid-cols-2 gap-10 pt-4">
                        <div>
                           <p className="text-[8px] font-black uppercase text-white/20 tracking-widest mb-2">Entity</p>
                           <p className="font-black text-xl italic tracking-tight">{msg.scanResult.merchant}</p>
                        </div>
                        <div>
                           <p className="text-[8px] font-black uppercase text-white/20 tracking-widest mb-2">Value Vector</p>
                           <p className="font-black text-2xl italic text-primary tracking-tighter">₹{msg.scanResult.amount.toLocaleString()}</p>
                        </div>
                        {msg.scanResult.taxAmount && (
                          <div className="col-span-2 flex justify-between items-center py-4 border-y border-white/5">
                             <span className="text-[10px] font-black uppercase text-white/20 tracking-widest">Tax Component (GST)</span>
                             <span className="text-sm font-black text-accent italic">₹{msg.scanResult.taxAmount}</span>
                          </div>
                        )}
                        <div className="col-span-2">
                           <p className="text-[8px] font-black uppercase text-white/20 tracking-widest mb-2">Temporal Point</p>
                           <p className="text-sm font-bold text-white/60">{msg.scanResult.date}</p>
                        </div>
                     </div>

                     <Button 
                        className="w-full h-16 rounded-[1.8rem] bg-primary text-white font-black uppercase text-[10px] tracking-[0.4em] shadow-3xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all" 
                        onClick={() => syncToLedger(msg.scanResult)}
                      >
                        Synchronize Ledger
                      </Button>
                  </div>
                )}

                {msg.strategicInfo && (
                  <div className="mt-10 p-8 glass-dark rounded-[2.5rem] border-white/10 space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5"><BrainCircuit size={80} /></div>
                    <div className="flex items-center justify-between relative z-10">
                       <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Strategic Pulse</h4>
                       <span className="text-3xl font-black italic text-primary tracking-tighter">{msg.strategicInfo.rating}/100</span>
                    </div>
                    <div className="space-y-6 relative z-10">
                       <div>
                          <p className="text-[8px] font-black uppercase text-white/20 tracking-widest mb-2">Commercial Protocol</p>
                          <p className="text-sm font-bold leading-relaxed">{msg.strategicInfo.action}</p>
                       </div>
                       <div>
                          <p className="text-[8px] font-black uppercase text-white/20 tracking-widest mb-2">Market Readiness Matrix</p>
                          <p className="text-[11px] font-bold leading-relaxed text-white/50 italic">{msg.strategicInfo.marketCorrelation}</p>
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
            <div className="glass p-8 rounded-[3rem] rounded-tl-none border-white/10 flex items-center gap-6">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
              <span className="text-[10px] font-black text-accent uppercase tracking-[0.6em] animate-pulse">Synthesizing...</span>
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-32 left-0 right-0 p-8 z-40">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-4">
            {SUGGESTIONS.map((s) => (
              <Button 
                key={s.label} 
                variant="outline" 
                className={cn(
                  "whitespace-nowrap rounded-[1.5rem] glass border-white/10 text-[9px] font-black uppercase tracking-[0.2em] h-14 px-8 hover:bg-white/10 transition-all",
                  s.action === 'purchase' && "border-primary/40 bg-primary/5 text-primary"
                )}
                onClick={() => {
                  if (s.action === 'scan') fileInputRef.current?.click();
                  else if (s.action === 'purchase') setInput("Can I afford a laptop for 150000?");
                  else handleSend(s.label);
                }}
              >
                <s.icon className="h-4 w-4 mr-3" />
                {s.label}
              </Button>
            ))}
          </div>
          <div className="relative flex items-center px-4">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-[3rem] blur opacity-40"></div>
            <Input 
              placeholder={isRecording ? "Listening to your pulse..." : "Query the financial matrix..."}
              className="h-24 rounded-[3rem] glass border-white/10 shadow-3xl text-xl font-black italic placeholder:text-white/10 px-12 pr-28 relative z-10"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button 
              size="icon" 
              className="absolute right-8 h-16 w-16 rounded-[2rem] bg-primary hover:bg-primary/80 shadow-2xl shadow-primary/40 z-20 transition-all active:scale-90"
              onClick={() => handleSend()}
              disabled={isTyping || !input.trim()}
            >
              <Send className="h-7 w-7" />
            </Button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
