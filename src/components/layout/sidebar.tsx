
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ReceiptText, 
  Target, 
  PieChart, 
  CreditCard, 
  Bell, 
  FileText, 
  Sparkles,
  Wallet,
  UserCircle,
  Settings,
  LogOut,
  BrainCircuit,
  TrendingUp,
  Globe,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ReceiptText },
  { href: '/budget', label: 'Budgets', icon: PieChart },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/analytics', label: 'Analytics', icon: TrendingUp },
  { href: '/market', label: 'Market Intelligence', icon: Globe },
  { href: '/investments', label: 'Wealth Terminal', icon: Briefcase },
  { href: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/reminders', label: 'Bills & Reminders', icon: Bell },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/ai-assistant', label: 'AI Assistant', icon: Sparkles },
];

const accountItems = [
  { href: '/wallets', label: 'Wallets & Accounts', icon: Wallet },
  { href: '/profile', label: 'Profile', icon: UserCircle },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <aside className="hidden md:flex flex-col w-72 h-screen fixed left-0 top-0 bg-[#020617] border-r border-white/5 z-50 overflow-y-auto scrollbar-hide">
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <BrainCircuit className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">SpendWise</h1>
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">Spend Smart, Live Better</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-8 mt-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group",
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-white/40 hover:text-white hover:bg-white/[0.03]"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                pathname === item.href ? "text-primary" : "text-white/20 group-hover:text-white/60"
              )} />
              <span className="text-sm font-semibold">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="space-y-4 pt-4">
          <p className="px-4 text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">Account</p>
          <div className="space-y-1">
            {accountItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-white/40 hover:text-white hover:bg-white/[0.03] group",
                  pathname === item.href && "bg-white/[0.05] text-white"
                )}
              >
                <item.icon className="w-5 h-5 text-white/20 group-hover:text-white/60" />
                <span className="text-sm font-semibold">{item.label}</span>
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/5 group"
            >
              <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              <span className="text-sm font-semibold">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="p-6 mt-auto">
        <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/5 border border-white/5 relative overflow-hidden group">
          <div className="relative z-10 space-y-4">
             <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Financial Health</p>
                <TrendingUp className="w-4 h-4 text-primary" />
             </div>
             <div>
                <h3 className="text-3xl font-bold italic tracking-tighter">85<span className="text-sm text-white/20 not-italic">/100</span></h3>
                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Excellent</p>
             </div>
             <p className="text-[10px] text-white/40 leading-relaxed">Keep it up! You are doing great in managing your matrix.</p>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
        </div>
      </div>
    </aside>
  );
}
