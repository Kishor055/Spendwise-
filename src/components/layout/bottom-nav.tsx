"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ReceiptText, UserCircle, Plus, Target, CreditCard, Sparkles } from 'lucide-react';
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

const navItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/transactions', label: 'History', icon: ReceiptText },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/subscriptions', label: 'Subs', icon: CreditCard },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

export function BottomNav() {
  const pathname = usePathname();
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <nav className="fixed bottom-6 left-6 right-6 z-50 glass rounded-[2.5rem] py-3 px-6 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.1)] md:max-w-md md:mx-auto">
      {navItems.slice(0, 2).map((item) => (
        <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 group">
          <item.icon className={cn(
            "h-5 w-5 transition-all duration-300",
            pathname === item.href ? "text-primary scale-110" : "text-muted-foreground group-hover:text-primary"
          )} />
          <span className={cn(
            "text-[8px] font-black uppercase tracking-widest transition-colors",
            pathname === item.href ? "text-primary" : "text-muted-foreground"
          )}>{item.label}</span>
        </Link>
      ))}

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogTrigger asChild>
          <Button size="icon" className="h-14 w-14 rounded-full -mt-12 bg-primary shadow-2xl shadow-primary/30 border-4 border-[#f8f9ff] hover:scale-110 active:scale-95 transition-all">
            <Plus className="h-7 w-7 text-white" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] glass-dark rounded-[3rem] border-none">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Quick Record</DialogTitle>
          </DialogHeader>
          <TransactionForm onSuccess={() => setIsAddOpen(false)} />
        </DialogContent>
      </Dialog>

      {navItems.slice(2, 4).map((item) => (
        <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 group">
          <item.icon className={cn(
            "h-5 w-5 transition-all duration-300",
            pathname === item.href ? "text-primary scale-110" : "text-muted-foreground group-hover:text-primary"
          )} />
          <span className={cn(
            "text-[8px] font-black uppercase tracking-widest transition-colors",
            pathname === item.href ? "text-primary" : "text-muted-foreground"
          )}>{item.label}</span>
        </Link>
      ))}
      
      <Link href="/profile" className="flex flex-col items-center gap-1 group">
        <UserCircle className={cn(
          "h-5 w-5 transition-all duration-300",
          pathname === '/profile' ? "text-primary scale-110" : "text-muted-foreground group-hover:text-primary"
        )} />
        <span className={cn(
          "text-[8px] font-black uppercase tracking-widest transition-colors",
          pathname === '/profile' ? "text-primary" : "text-muted-foreground"
        )}>Profile</span>
      </Link>
    </nav>
  );
}
