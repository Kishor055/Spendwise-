'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { askFinancialAdvisor } from '@/ai/flows/financial-advisor-flow';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Send, Bot, User, Loader2, ChevronLeft, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "How can I save $500 this month?",
  "What is my biggest expense?",
  "Analyze my spending habits",
  "Can I afford a new laptop?"
];

export default function AIAssistantPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm Spendwise AI. I've analyzed your recent transactions. How can I help you optimize your wealth today?" }
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
          monthlyBudget: 2500
        }
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting to my brain right now. Please try again in a moment." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-44">
      <header className="px-6 py-8 bg-background/50 backdrop-blur-xl sticky top-0 z-50 border-b flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-2xl glass h-10 w-10" asChild>
            <Link href="/dashboard"><ChevronLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              Wealth Advisor
            </h1>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Advanced Financial Intelligence</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-hide" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[85%] p-5 rounded-[2rem] shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2",
              msg.role === 'user' 
                ? "bg-primary text-primary-foreground rounded-tr-none" 
                : "glass rounded-tl-none border-none"
            )}>
              <div className="flex items-start gap-3">
                {msg.role === 'assistant' && <Bot className="h-5 w-5 mt-1 shrink-0 text-primary" />}
                <p className="text-sm font-bold leading-relaxed">{msg.content}</p>
                {msg.role === 'user' && <User className="h-5 w-5 mt-1 shrink-0 opacity-50" />}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="glass p-5 rounded-[2rem] rounded-tl-none border-none flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs font-black text-muted-foreground animate-pulse uppercase tracking-widest">Analyzing your data...</span>
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-24 left-0 right-0 p-6 bg-background/80 backdrop-blur-xl border-t z-40">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {SUGGESTED_QUESTIONS.map((q) => (
              <Button 
                key={q} 
                variant="outline" 
                className="whitespace-nowrap rounded-full glass border-none text-[10px] font-black uppercase tracking-widest h-8"
                onClick={() => handleSend(q)}
              >
                <HelpCircle className="h-3 w-3 mr-2 text-primary" />
                {q}
              </Button>
            ))}
          </div>
          <div className="relative flex items-center">
            <Input 
              placeholder="Ask anything about your money..." 
              className="pr-14 h-14 rounded-3xl glass border-none shadow-inner text-base font-medium"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button 
              size="icon" 
              className="absolute right-2 h-10 w-10 rounded-2xl bg-primary shadow-lg"
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