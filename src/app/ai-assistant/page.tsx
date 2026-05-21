'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { askFinancialAdvisor } from '@/ai/flows/financial-advisor-flow';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Send, Bot, User, Loader2, ChevronLeft, HelpCircle, Zap, Cpu } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "How can I save ₹5000 this month?",
  "Analyze my spending vibes",
  "Biggest cash burn this week?",
  "Predict next month outflow"
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
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 blur-[150px] rounded-full" />

      <header className="px-6 py-8 bg-[#020617]/40 backdrop-blur-3xl sticky top-0 z-50 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Button variant="ghost" size="icon" className="rounded-2xl glass h-12 w-12 hover:bg-white/10" asChild>
            <Link href="/dashboard"><ChevronLeft className="h-6 w-6" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-black flex items-center gap-3 text-glow">
              <Cpu className="h-6 w-6 text-primary animate-pulse" />
              Nexus Core
            </h1>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">Quantum Advisory Active</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-10 space-y-8 scrollbar-hide relative z-10" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[88%] p-6 rounded-[2.5rem] shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-4",
              msg.role === 'user' 
                ? "bg-primary/90 text-white rounded-tr-none border border-white/20 shadow-[0_0_30px_rgba(var(--primary),0.2)]" 
                : "glass rounded-tl-none border-white/10 text-white/90"
            )}>
              <div className="flex items-start gap-4">
                {msg.role === 'assistant' && <div className="p-2 bg-primary/20 rounded-xl"><Bot className="h-5 w-5 text-primary" /></div>}
                <p className="text-sm font-bold leading-relaxed tracking-tight">{msg.content}</p>
                {msg.role === 'user' && <div className="p-2 bg-white/10 rounded-xl"><User className="h-5 w-5 opacity-60" /></div>}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="glass p-6 rounded-[2.5rem] rounded-tl-none border-white/10 flex items-center gap-4">
              <div className="relative">
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
                <div className="absolute inset-0 blur-md bg-accent/30 animate-pulse" />
              </div>
              <span className="text-[10px] font-black text-accent animate-pulse uppercase tracking-[0.3em]">Synthesizing Data...</span>
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-28 left-0 right-0 p-6 z-40">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {SUGGESTED_QUESTIONS.map((q) => (
              <Button 
                key={q} 
                variant="outline" 
                className="whitespace-nowrap rounded-full glass border-white/10 text-[10px] font-black uppercase tracking-widest h-10 px-6 hover:bg-white/10 hover:border-accent/50 transition-all"
                onClick={() => handleSend(q)}
              >
                <HelpCircle className="h-3.5 w-3.5 mr-2 text-accent" />
                {q}
              </Button>
            ))}
          </div>
          <div className="relative flex items-center group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <Input 
              placeholder="Query the Nexus..." 
              className="relative pr-16 h-16 rounded-3xl glass border-white/10 shadow-2xl text-base font-medium placeholder:text-white/20"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button 
              size="icon" 
              className="absolute right-3 h-11 w-11 rounded-2xl bg-primary hover:bg-primary/80 shadow-xl transition-all active:scale-90"
              onClick={() => handleSend()}
              disabled={isTyping || !input.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}