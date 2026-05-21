"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ReceiptText, UserCircle, Plus, Target, CreditCard, Bot } from 'lucide-react';
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

const navItemsLeft = [
  { href: '/dashboard', label: 'Matrix', icon: LayoutDashboard },
  { href: '/transactions', label: 'Logs', icon: ReceiptText },
];

const navItemsRight = [
  { href: '/goals', label: 'Targets', icon: Target },
  { href: '/subscriptions', label: 'Recurring', icon: CreditCard },
  { href: '/profile', label: 'Identity', icon: UserCircle },
];

export function BottomNav() {
  const pathname = usePathname();
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <nav className="fixed bottom-10 left-6 right-6 z-50 glass rounded-[2.5rem] py-5 px-6 flex items-center justify-between shadow-[0_35px_70px_rgba(0,0,0,0.8)] border-white/20 md:max-w-2xl md:mx-auto">
      <div className="flex items-center justify-around flex-1">
        {navItemsLeft.map((item) => (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1.5 group flex-1">
            <item.icon className={cn(
              "h-6 w-6 transition-all duration-500",
              pathname === item.href ? "text-primary scale-125 text-glow" : "text-white/40 group-hover:text-primary group-hover:scale-110"
            )} />
            <span className={cn(
              "text-[9px] font-black uppercase tracking-[0.2em] transition-all",
              pathname === item.href ? "text-primary opacity-100" : "text-white/30 opacity-60"
            )}>{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="mx-4">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <div className="relative group -mt-16">
              <div className="absolute -inset-3 bg-gradient-to-r from-primary via-accent to-primary rounded-full blur-md opacity-50 group-hover:opacity-100 animate-pulse transition duration-1000"></div>
              <Button size="icon" className="relative h-16 w-16 rounded-full bg-primary shadow-2xl border-4 border-[#020617] hover:scale-110 active:scale-95 transition-all duration-300">
                <Plus className="h-8 w-8 text-white" />
              </Button>
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] glass-dark rounded-[3.5rem] border-white/20 shadow-[0_0_100px_rgba(var(--primary),0.2)]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-glow">Quick Entry</DialogTitle>
            </DialogHeader>
            <TransactionForm onSuccess={() => setIsAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-around flex-1">
        {navItemsRight.map((item) => (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1.5 group flex-1">
            <item.icon className={cn(
              "h-6 w-6 transition-all duration-500",
              pathname === item.href ? "text-primary scale-125 text-glow" : "text-white/40 group-hover:text-primary group-hover:scale-110"
            )} />
            <span className={cn(
              "text-[9px] font-black uppercase tracking-[0.2em] transition-all",
              pathname === item.href ? "text-primary opacity-100" : "text-white/30 opacity-60"
            )}>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}