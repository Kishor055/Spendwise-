
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ReceiptText, PieChart, Sparkles, UserCircle, Plus } from 'lucide-react';
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
  { href: '/ai-assistant', label: 'Advisor', icon: Sparkles },
  { href: '/analytics', label: 'Insights', icon: PieChart },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

export function BottomNav() {
  const pathname = usePathname();
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-t border-border px-4 py-2 flex items-center justify-around md:hidden">
      {navItems.slice(0, 2).map((item) => (
        <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 group">
          <item.icon className={cn(
            "h-5 w-5 transition-colors",
            pathname === item.href ? "text-primary" : "text-muted-foreground group-hover:text-primary"
          )} />
          <span className={cn(
            "text-[9px] font-black uppercase tracking-tighter transition-colors",
            pathname === item.href ? "text-primary" : "text-muted-foreground"
          )}>{item.label}</span>
        </Link>
      ))}

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogTrigger asChild>
          <Button size="icon" className="h-12 w-12 rounded-full -mt-8 shadow-2xl border-4 border-background bg-primary hover:bg-primary/90 transition-transform active:scale-90">
            <Plus className="h-6 w-6 text-white" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-none">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Quick Record</DialogTitle>
          </DialogHeader>
          <TransactionForm onSuccess={() => setIsAddOpen(false)} />
        </DialogContent>
      </Dialog>

      {navItems.slice(2).map((item) => (
        <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 group">
          <item.icon className={cn(
            "h-5 w-5 transition-colors",
            pathname === item.href ? "text-primary" : "text-muted-foreground group-hover:text-primary"
          )} />
          <span className={cn(
            "text-[9px] font-black uppercase tracking-tighter transition-colors",
            pathname === item.href ? "text-primary" : "text-muted-foreground"
          )}>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
