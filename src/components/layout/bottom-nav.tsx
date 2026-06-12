"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ReceiptText, UserCircle, Plus, PieChart, TrendingUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  { href: '/transactions', label: 'Matrix', icon: ReceiptText },
  { href: '/plus', label: 'Add', icon: Plus, isAction: true },
  { href: '/budget', label: 'Limits', icon: PieChart },
  { href: '/analytics', label: 'Trends', icon: TrendingUp },
];

export function BottomNav() {
  const pathname = usePathname();
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <nav className="pill-nav">
      {navItems.map((item) => {
        if (item.isAction) {
          return (
            <div key="action-btn" className="relative px-2">
               <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                 <DialogTrigger asChild>
                    <button className="h-14 w-14 rounded-2xl bg-primary shadow-xl shadow-primary/40 border-4 border-[#020617] flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-20">
                       <Plus className="h-7 w-7 text-white" />
                    </button>
                 </DialogTrigger>
                 <DialogContent className="sm:max-w-[425px] bg-[#020617]/95 backdrop-blur-3xl rounded-[3rem] border-white/10 shadow-3xl">
                    <DialogHeader>
                       <DialogTitle className="text-2xl font-bold italic tracking-tighter">Matrix Entry</DialogTitle>
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
            className="flex flex-col items-center gap-1 group relative py-3 px-4"
          >
            <item.icon className={cn(
              "h-6 w-6 transition-all duration-300",
              isActive ? "text-primary" : "text-white/20 group-hover:text-white/60"
            )} />
            <span className={cn(
              "text-[8px] font-bold uppercase tracking-[0.2em] transition-all",
              isActive ? "text-primary opacity-100" : "text-white/10 opacity-0 group-hover:opacity-40"
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}