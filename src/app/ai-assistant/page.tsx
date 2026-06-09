
'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { askFinancialAdvisor } from '@/ai/flows/financial-advisor-flow';
import { advisePurchase } from '@/ai/flows/purchase-advisor-flow';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Sparkles, 
  Send, 
  Bot, 
  Loader2, 
  ChevronLeft, 
  Wallet, 
  PieChart, 
  Briefcase, 
  Zap, 
  ShieldCheck, 
  Target,
  ShoppingCart,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

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
}

const SUGGESTIONS = [
  { label: "Should I buy...", icon: ShoppingCart, isSpecial: true },
  { label: "Job Market Readiness", icon: Briefcase },
  { label: "Strategic Reduction", icon: Zap },
  { label: "Goal Manifestation", icon: Target }
];

export default function AIAssistantPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [input, setInput] = useState('');
  const [isPurchaseMode, setIsPurchaseMode] = useState(false);
  const [purchaseItem, setPurchaseItem] = useState({ name: '', price: '' });
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Welcome to the Nexus Intelligence Hub. SpendWise 3.0 Vision is active. I am your AI Financial Twin. Ready for simulation." }
  ]);
  const [isTyping, setIsTyping] = useState(false);
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

  const handlePurchaseAdvice = async () => {
    if (!purchaseItem.name || !purchaseItem.price || !user) return;
    
    const priceNum = parseFloat(purchaseItem.price);
    setMessages(prev => [...prev, { role: 'user', content: `Should I buy ${purchaseItem.name} for ₹${priceNum}?` }]);
    setIsPurchaseMode(false);
    setIsTyping(true);

    try {
      const response = await advisePurchase({
        itemName: purchaseItem.name,
        price: priceNum,
        transactions: (transactions || []).map(t => ({ amount: t.amount, type: t.type, category: t.category })),
        budgets: (budgets || []).map(b => ({ category: b.category, limit: b.limit })),
        goals: (goals || []).map(g => ({ title: g.title, targetAmount: g.targetAmount, currentAmount: g.currentAmount }))
      });

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `I've simulated the purchase of ${purchaseItem.name}. Here is my twin-analysis.`,
        purchaseAdvice: response
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Simulated link failed. The Twin is recalibrating." }]);
    } finally {
      setIsTyping(false);
      setPurchaseItem({ name: '', price: '' });
    }
  };

  const handleSend = async (customMessage?: string) => {
    const messageToSend = customMessage || input;
    if (!messageToSend.trim() || isTyping || !user) return;

    if (messageToSend.toLowerCase().startsWith("should i buy")) {
      setIsPurchaseMode(true);
      return;
    }

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
      setMessages(prev => [...prev, { role: 'assistant', content: "Neural link interrupted. Ensure Gemini API key is valid and re-syncing..." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-44 bg-[#020617] text-white overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 blur-[150px] rounded-full" />
      </div>

      <header className="px-8 py-8 bg-[#020617]/60 backdrop-blur-3xl sticky top-0 z-50 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" className="rounded-2xl glass h-14 w-14 hover:bg-white/10" asChild>
            <Link href="/dashboard"><ChevronLeft className="h-7 w-7" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black flex items-center gap-4 italic text-glow">
              <Sparkles className="h-8 w-8 text-primary" />
              Financial Twin
            </h1>
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest text-accent">SpendWise 3.0 Active</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-12 space-y-12 scrollbar-hide relative z-10" ref={scrollRef}>
        <div className="flex flex-col items-center justify-center py-10 text-center space-y-8">
           <div className="w-40 h-40 relative">
              <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full animate-pulse" />
              <div className="relative glass rounded-full p-4 border-white/20">
                 <Image src="https://picsum.photos/seed/cybertwin/200/200" width={160} height={160} alt="AI Assistant" className="rounded-full grayscale contrast-150" />
              </div>
           </div>
           <div>
              <h2 className="text-xl font-black italic tracking-tighter uppercase tracking-[0.2em]">Neural Clone Terminal</h2>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.4em] mt-3">Simulating future financial patterns...</p>
           </div>
        </div>

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
                
                {msg.purchaseAdvice && (
                   <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-8 pt-8 border-t border-white/10 space-y-6"
                  >
                     <div className={cn(
                       "flex items-center gap-4 p-5 rounded-2xl border",
                       msg.purchaseAdvice.decision === 'BUY' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                       msg.purchaseAdvice.decision === 'WAIT' ? "bg-orange-500/10 border-orange-500/20 text-orange-500" :
                       "bg-rose-500/10 border-rose-500/20 text-rose-500"
                     )}>
                        {msg.purchaseAdvice.decision === 'BUY' ? <CheckCircle2 className="h-6 w-6" /> :
                         msg.purchaseAdvice.decision === 'WAIT' ? <AlertTriangle className="h-6 w-6" /> :
                         <XCircle className="h-6 w-6" />}
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-widest">Neural Decision</p>
                          <p className="text-xl font-black italic">{msg.purchaseAdvice.decision}</p>
                        </div>
                     </div>
                     
                     <div className="space-y-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Reasoning</h4>
                        <p className="text-sm font-bold leading-relaxed text-white/80">{msg.purchaseAdvice.reasoning}</p>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                           <p className="text-[8px] font-black uppercase tracking-widest text-white/40">Budget Impact</p>
                           <p className="text-lg font-black">{msg.purchaseAdvice.budgetImpact}/100</p>
                        </div>
                        <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                           <p className="text-[8px] font-black uppercase tracking-widest text-white/40">Goal Delay</p>
                           <p className="text-xs font-bold">{msg.purchaseAdvice.goalDelay}</p>
                        </div>
                     </div>

                     <div className="p-5 bg-primary/10 rounded-2xl border border-primary/20">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Twin Suggestion</p>
                        <p className="text-sm font-bold italic">{msg.purchaseAdvice.alternative}</p>
                     </div>
                  </motion.div>
                )}

                {msg.strategicInfo && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-8 pt-8 border-t border-white/10 space-y-6"
                  >
                    <div className="flex items-center gap-4 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                      <ShieldCheck className="h-5 w-5 text-emerald-500" />
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Efficiency Rating</p>
                        <p className="text-lg font-black italic">{msg.strategicInfo.rating}/100</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Zap className="h-4 w-4 text-accent" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-accent">Strategic Move</h4>
                      </div>
                      <p className="text-xs font-bold text-white/60 leading-relaxed">{msg.strategicInfo.action}</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Briefcase className="h-4 w-4 text-primary" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Market Correlation</h4>
                      </div>
                      <p className="text-xs font-bold text-white/60 leading-relaxed">{msg.strategicInfo.marketCorrelation}</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="glass p-6 rounded-[2.5rem] rounded-tl-none border-white/10 flex items-center gap-4">
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
              <span className="text-[10px] font-black text-accent uppercase tracking-[0.4em]">Simulating Neural Twins...</span>
            </div>
          </motion.div>
        )}
      </main>

      <div className="fixed bottom-32 left-0 right-0 p-8 z-40">
        <div className="max-w-3xl mx-auto space-y-6">
          <AnimatePresence>
            {isPurchaseMode && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="glass p-8 rounded-[2.5rem] border-white/20 mb-6 space-y-4 shadow-3xl"
              >
                <div className="flex items-center justify-between">
                   <h3 className="text-xs font-black uppercase tracking-widest text-accent">Purchase Decision Engine</h3>
                   <Button variant="ghost" size="sm" onClick={() => setIsPurchaseMode(false)} className="h-6 text-[8px] font-black uppercase tracking-widest opacity-40">Cancel</Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <Input 
                    placeholder="Item Name (e.g. MacBook Air)" 
                    className="h-14 rounded-2xl bg-[#0a0a16] border-white/10 font-bold"
                    value={purchaseItem.name}
                    onChange={(e) => setPurchaseItem({...purchaseItem, name: e.target.value})}
                   />
                   <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-white/20">₹</span>
                      <Input 
                        placeholder="Price" 
                        type="number"
                        className="h-14 rounded-2xl bg-[#0a0a16] border-white/10 font-bold pl-10"
                        value={purchaseItem.price}
                        onChange={(e) => setPurchaseItem({...purchaseItem, price: e.target.value})}
                      />
                   </div>
                </div>
                <Button className="w-full h-14 rounded-2xl bg-accent text-accent-foreground font-black uppercase tracking-widest text-[10px]" onClick={handlePurchaseAdvice}>
                  Consult the Twin
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {SUGGESTIONS.map((s) => (
              <Button 
                key={s.label} 
                variant="outline" 
                className={cn(
                  "whitespace-nowrap rounded-2xl glass border-white/10 text-[10px] font-black uppercase tracking-widest h-12 px-6 hover:bg-white/10 group",
                  s.isSpecial && "border-primary/40 bg-primary/5 text-primary"
                )}
                onClick={() => {
                  if (s.isSpecial) setIsPurchaseMode(true);
                  else handleSend(`Strategic analysis for: ${s.label}`);
                }}
              >
                <s.icon className={cn("h-4 w-4 mr-3 transition-transform group-hover:scale-110", s.isSpecial ? "text-primary" : "text-accent")} />
                {s.label}
              </Button>
            ))}
          </div>
          <div className="relative flex items-center">
            <Input 
              placeholder="Query the strategic matrix..." 
              className="h-20 rounded-[2.5rem] glass border-white/10 shadow-3xl text-lg font-bold placeholder:text-white/20 px-10 pr-24"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button 
              size="icon" 
              className="absolute right-4 h-14 w-14 rounded-[1.5rem] bg-primary hover:bg-primary/80 transition-all active:scale-90"
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
