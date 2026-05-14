
'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { askFinancialAdvisor } from '@/ai/flows/financial-advisor-flow';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Send, Bot, User, Loader2, Wallet, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistantPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your Spendwise AI advisor. How can I help you manage your finances today?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc'), limit(20));
  }, [firestore, user]);

  const { data: transactions } = useCollection(transactionsQuery);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping || !user) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const response = await askFinancialAdvisor({
        query: userMessage,
        transactions: (transactions || []).map(t => ({
          amount: t.amount,
          type: t.type,
          category: t.category,
          date: t.date?.seconds ? new Date(t.date.seconds * 1000).toISOString() : new Date().toISOString(),
          note: t.note
        })),
        userProfile: {
          name: user.displayName || 'User',
          monthlyBudget: 2000 // Default or fetch from profile
        }
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      <header className="px-6 py-6 bg-background/80 backdrop-blur-md sticky top-0 z-50 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/dashboard"><ChevronLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              AI Advisor
            </h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Powered by Gemini</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-hide" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[85%] p-4 rounded-[1.5rem] shadow-sm",
              msg.role === 'user' 
                ? "bg-primary text-primary-foreground rounded-tr-none" 
                : "glass-card rounded-tl-none border-none"
            )}>
              <div className="flex items-start gap-3">
                {msg.role === 'assistant' && <Bot className="h-5 w-5 mt-1 shrink-0 text-primary" />}
                <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                {msg.role === 'user' && <User className="h-5 w-5 mt-1 shrink-0 opacity-50" />}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="glass-card p-4 rounded-[1.5rem] rounded-tl-none border-none flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs font-bold text-muted-foreground animate-pulse">Spendwise is thinking...</span>
            </div>
          </div>
        )}
      </main>

      <div className="p-6 bg-background/80 backdrop-blur-lg border-t fixed bottom-20 left-0 right-0 max-w-4xl mx-auto">
        <div className="relative flex items-center">
          <Input 
            placeholder="Ask anything about your spending..." 
            className="pr-12 h-14 rounded-2xl bg-muted/50 border-none shadow-inner text-base"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button 
            size="icon" 
            className="absolute right-2 h-10 w-10 rounded-xl shadow-lg"
            onClick={handleSend}
            disabled={isTyping}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
