
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ReceiptText, UserCircle, Plus, Target, PieChart, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TransactionForm } from '@/components/transactions/transaction-form';
import { useState } from 'react';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/transactions', label: 'History', icon: ReceiptText },
  { href: '/plus', label: 'Add', icon: Plus, isAction: true },
  { href: '/analytics', label: 'Analytics', icon: PieChart },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

export function BottomNav() {
  const pathname = usePathname();
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a16]/80 backdrop-blur-3xl rounded-[2.5rem] py-3 px-8 flex items-center justify-around shadow-[0_25px_60px_rgba(0,0,0,0.9)] border border-white/10 w-[95%] max-w-lg">
      {navItems.map((item) => {
        if (item.isAction) {
          return (
            <div key="action-btn" className="relative group">
               <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                 <DialogTrigger asChild>
                    <button className="relative -top-8 h-16 w-16 rounded-full bg-primary shadow-2xl shadow-primary/40 border-[6px] border-[#030616] flex items-center justify-center hover:scale-110 active:scale-90 transition-all">
                       <Plus className="h-8 w-8 text-white" />
                    </button>
                 </DialogTrigger>
                 <DialogContent className="sm:max-w-[400px] bg-[#030616]/95 backdrop-blur-3xl rounded-[2.5rem] border-white/10">
                    <DialogHeader>
                       <DialogTitle className="text-xl font-black italic">Quick Entry</DialogTitle>
                    </DialogHeader>
                    <TransactionForm onSuccess={() => setIsAddOpen(false)} />
                 </DialogContent>
               </Dialog>
            </div>
          );
        }
        
        const isActive = pathname === item.href;
        
        return (
          <Link 
            key={item.href} 
            href={item.href} 
            className="flex flex-col items-center gap-1 group relative py-2 px-3"
          >
            <item.icon className={cn(
              "h-5 w-5 transition-all duration-300",
              isActive ? "text-primary" : "text-white/30 group-hover:text-white"
            )} />
            <span className={cn(
              "text-[8px] font-black uppercase tracking-widest transition-all",
              isActive ? "text-primary opacity-100" : "text-white/20 opacity-0 group-hover:opacity-60"
            )}>
              {item.label}
            </span>
            {isActive && (
              <motion.div 
                layoutId="nav-active"
                className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
