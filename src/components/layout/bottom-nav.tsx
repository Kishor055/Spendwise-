"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ReceiptText, UserCircle, Plus, Target } from 'lucide-react';
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
  { href: '/profile', label: 'Self', icon: UserCircle },
];

export function BottomNav() {
  const pathname = usePathname();
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a16]/80 backdrop-blur-3xl rounded-[2.5rem] py-3 px-8 flex items-center justify-between shadow-[0_25px_60px_rgba(0,0,0,0.9)] border border-white/[0.05] w-[90%] md:max-w-xl">
      <div className="flex items-center justify-around flex-1">
        {navItemsLeft.map((item) => (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 group flex-1">
            <item.icon className={cn(
              "h-5 w-5 transition-all duration-300",
              pathname === item.href ? "text-primary scale-110" : "text-white/20 group-hover:text-white"
            )} />
            <span className={cn(
              "text-[8px] font-black uppercase tracking-[0.1em] transition-all",
              pathname === item.href ? "text-primary opacity-100" : "text-white/20 opacity-60"
            )}>{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="mx-6">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <div className="relative group">
              <div className="absolute -inset-2 bg-primary rounded-full blur-md opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <Button size="icon" className="relative h-12 w-12 rounded-full bg-primary shadow-2xl border-4 border-[#020617] hover:scale-105 active:scale-95 transition-all">
                <Plus className="h-6 w-6 text-white" />
              </Button>
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px] bg-[#020617]/95 backdrop-blur-3xl rounded-[2.5rem] border-white/5">
            <DialogHeader>
              <DialogTitle className="text-lg font-black italic">Quick Entry</DialogTitle>
            </DialogHeader>
            <TransactionForm onSuccess={() => setIsAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-around flex-1">
        {navItemsRight.map((item) => (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 group flex-1">
            <item.icon className={cn(
              "h-5 w-5 transition-all duration-300",
              pathname === item.href ? "text-primary scale-110" : "text-white/20 group-hover:text-white"
            )} />
            <span className={cn(
              "text-[8px] font-black uppercase tracking-[0.1em] transition-all",
              pathname === item.href ? "text-primary opacity-100" : "text-white/20 opacity-60"
            )}>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}