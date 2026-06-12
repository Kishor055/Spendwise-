"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ReceiptText, UserCircle, Plus, PieChart, Bell, Target, LineChart, CreditCard, TrendingUp } from 'lucide-react';
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
  { href: '/dashboard', label: 'Matrix', icon: LayoutDashboard },
  { href: '/investments', label: 'Wealth', icon: TrendingUp },
  { href: '/plus', label: 'Add', icon: Plus, isAction: true },
  { href: '/subscriptions', label: 'Leaks', icon: CreditCard },
  { href: '/profile', label: 'Identity', icon: UserCircle },
];

export function BottomNav() {
  const pathname = usePathname();
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <nav className="pill-nav">
      {navItems.map((item) => {
        if (item.isAction) {
          return (
            <div key="action-btn" className="relative">
               <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                 <DialogTrigger asChild>
                    <button className="relative -top-10 h-20 w-20 rounded-full bg-primary shadow-[0_20px_40px_rgba(139,92,246,0.6)] border-[8px] border-[#020617] flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-20">
                       <Plus className="h-10 w-10 text-white" />
                    </button>
                 </DialogTrigger>
                 <DialogContent className="sm:max-w-[425px] bg-[#020617]/95 backdrop-blur-3xl rounded-[3rem] border-white/10 shadow-3xl">
                    <DialogHeader>
                       <DialogTitle className="text-2xl font-black italic">Matrix Entry</DialogTitle>
                    </DialogHeader>
                    <TransactionForm onSuccess={() => setIsAddOpen(false)} />
                 </DialogContent>
               </Dialog>
               <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-primary/20 blur-2xl rounded-full -z-10" />
            </div>
          );
        }
        
        const isActive = pathname === item.href;
        
        return (
          <Link 
            key={item.href} 
            href={item.href} 
            className="flex flex-col items-center gap-1.5 group relative py-3 px-4"
          >
            <item.icon className={cn(
              "h-7 w-7 transition-all duration-300",
              isActive ? "text-primary scale-110" : "text-white/20 group-hover:text-white/60"
            )} />
            <span className={cn(
              "text-[9px] font-black uppercase tracking-[0.2em] transition-all",
              isActive ? "text-primary opacity-100" : "text-white/10 opacity-0 group-hover:opacity-40"
            )}>
              {item.label}
            </span>
            {isActive && (
              <motion.div 
                layoutId="nav-active"
                className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(139,92,246,1)]"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
