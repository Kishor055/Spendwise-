'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { askFinancialAdvisor } from '@/ai/flows/financial-advisor-flow';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Send, Bot, User, Loader2, ChevronLeft, HelpCircle, Cpu, BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "Analyze my spending habits",
  "How can I save ₹10,000?",
  "Predict my next month",
  "Investment tips"
];

export default function AIAssistantPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Neural link established. I've analyzed your financial trajectory. How shall we optimize your wealth today?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc'), limit(50));
  }, [firestore, user]);

  const { data: transactions } = useCollection(transactionsQuery);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

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
        userProfile: {
          name: user.displayName || 'User',
          monthlyBudget: 50000
        }
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Neural sync interrupted. Please re-initiate command." }]);
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
          <Button variant="ghost" size="icon" className="rounded-2xl glass h-14 w-14 hover:bg-white/10 border-white/10" asChild>
            <Link href="/dashboard"><ChevronLeft className="h-7 w-7" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black flex items-center gap-4 text-glow italic">
              <BrainCircuit className="h-8 w-8 text-primary animate-pulse" />
              Nexus AI
            </h1>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
              <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.4em]">Quantum Advisory Active</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-12 space-y-10 scrollbar-hide relative z-10" ref={scrollRef}>
        <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
           <div className="w-28 h-28 rounded-[2.5rem] bg-primary/10 flex items-center justify-center p-6 border border-primary/20 shadow-3xl">
              <Bot className="w-full h-full text-primary" />
           </div>
           <div>
              <h2 className="text-2xl font-black italic tracking-tighter">Nexus Core Interface</h2>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.5em] mt-2">Neural Financial Intelligence</p>
           </div>
        </div>

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}
            >
              <div className={cn(
                "max-w-[85%] p-8 rounded-[3rem] shadow-3xl relative",
                msg.role === 'user' 
                  ? "bg-primary text-white rounded-tr-none border border-white/20" 
                  : "glass rounded-tl-none border-white/10"
              )}>
                <div className="flex items-start gap-5">
                  {msg.role === 'assistant' && <div className="p-3 bg-primary/20 rounded-2xl shrink-0"><Bot className="h-6 w-6 text-primary" /></div>}
                  <p className="text-base font-bold leading-relaxed tracking-tight text-white/90">{msg.content}</p>
                  {msg.role === 'user' && <div className="p-3 bg-white/10 rounded-2xl shrink-0"><User className="h-6 w-6 opacity-60" /></div>}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="glass p-8 rounded-[3rem] rounded-tl-none border-white/10 flex items-center gap-5">
              <div className="relative">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
                <div className="absolute inset-0 blur-md bg-accent/30 animate-pulse" />
              </div>
              <span className="text-[10px] font-black text-accent animate-pulse uppercase tracking-[0.4em]">Synthesizing Matrix...</span>
            </div>
          </motion.div>
        )}
      </main>

      <div className="fixed bottom-32 left-0 right-0 p-8 z-40">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {SUGGESTED_QUESTIONS.map((q) => (
              <Button 
                key={q} 
                variant="outline" 
                className="whitespace-nowrap rounded-full glass border-white/10 text-[10px] font-black uppercase tracking-[0.2em] h-12 px-8 hover:bg-white/10 hover:border-accent/50 transition-all"
                onClick={() => handleSend(q)}
              >
                <HelpCircle className="h-4 w-4 mr-3 text-accent" />
                {q}
              </Button>
            ))}
          </div>
          <div className="relative flex items-center group">
            <div className="absolute -inset-2 bg-gradient-to-r from-primary to-accent rounded-[3rem] blur opacity-20 group-hover:opacity-40 transition duration-700"></div>
            <Input 
              placeholder="Query the Nexus..." 
              className="relative pr-20 h-20 rounded-[2.5rem] glass border-white/10 shadow-3xl text-lg font-bold placeholder:text-white/20 px-8"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button 
              size="icon" 
              className="absolute right-4 h-14 w-14 rounded-3xl bg-primary hover:bg-primary/80 shadow-2xl transition-all active:scale-90"
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
