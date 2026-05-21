"use client";

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { BottomNav } from '@/components/layout/bottom-nav';
import { ArrowUpRight, ArrowDownRight, Search, Trash2, ChevronLeft, Download, FileText, Filter, Terminal } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: any;
  note?: string;
}

export default function TransactionsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const { toast } = useToast();

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc'));
  }, [firestore, user]);

  const { data: transactions } = useCollection<Transaction>(transactionsQuery);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(tx => {
      const matchesSearch = tx.category.toLowerCase().includes(search.toLowerCase()) || 
                            (tx.note && tx.note.toLowerCase().includes(search.toLowerCase()));
      const matchesFilter = filter === 'all' || tx.type === filter;
      return matchesSearch && matchesFilter;
    });
  }, [transactions, search, filter]);

  const handleDelete = (transactionId: string) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'users', user.uid, 'transactions', transactionId);
    deleteDocumentNonBlocking(docRef);
    toast({ title: 'System Updated', description: 'Log entry successfully purged.' });
  };

  const handleExportCSV = () => {
    if (!filteredTransactions.length) {
      toast({ variant: 'destructive', title: 'Data Null', description: 'No records available for extraction.' });
      return;
    }
    
    const headers = ['Date', 'Category', 'Type', 'Amount', 'Note'];
    const rows = filteredTransactions.map(tx => [
      tx.date?.seconds ? format(new Date(tx.date.seconds * 1000), 'yyyy-MM-dd') : '',
      `"${tx.category}"`,
      tx.type,
      tx.amount,
      `"${tx.note || ''}"`
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Nexus_Export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: 'Export Successful', description: 'Financial logs extracted to local storage.' });
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-40 selection:bg-accent/30">
      <header className="px-6 pt-12 pb-8 sticky top-0 bg-[#020617]/60 backdrop-blur-3xl z-50 border-b border-white/5">
        <div className="flex items-center justify-between mb-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-5">
            <Button variant="ghost" size="icon" className="rounded-2xl glass h-12 w-12 hover:bg-white/10" asChild>
              <Link href="/dashboard"><ChevronLeft className="h-6 w-6" /></Link>
            </Button>
            <h1 className="text-2xl font-black tracking-tighter text-glow flex items-center gap-3">
              <Terminal className="h-6 w-6 text-primary" />
              Nexus Logs
            </h1>
          </div>
          <Button variant="ghost" size="icon" className="rounded-2xl glass h-12 w-12 text-accent hover:bg-white/10" onClick={handleExportCSV}>
            <Download className="h-6 w-6" />
          </Button>
        </div>

        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <Input 
              placeholder="Search data logs..." 
              className="relative pl-12 h-14 rounded-2xl glass border-white/10 shadow-inner focus:border-primary/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {['all', 'income', 'expense'].map((f) => (
              <Button 
                key={f}
                variant={filter === f ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "rounded-full capitalize px-8 h-10 font-black text-[10px] tracking-[0.2em] transition-all duration-300",
                  filter === f 
                    ? "bg-primary text-white shadow-[0_0_20px_rgba(var(--primary),0.3)] border-white/10" 
                    : "glass border-white/5 hover:bg-white/10"
                )}
                onClick={() => setFilter(f as any)}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <main className="px-6 pt-10 space-y-4 max-w-4xl mx-auto">
        {filteredTransactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between p-7 glass rounded-[3rem] border-white/5 shadow-xl group relative animate-in fade-in slide-in-from-bottom-6 transition-all duration-500 hover:bg-white/[0.08] hover:border-white/20">
            <div className="flex items-center gap-6">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all group-hover:scale-110",
                tx.type === 'income' ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
              )}>
                {tx.type === 'income' ? <ArrowUpRight className="h-8 w-8" /> : <ArrowDownRight className="h-8 w-8" />}
              </div>
              <div>
                <p className="font-black text-lg text-white/90 tracking-tight">{tx.category}</p>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mt-1">
                  {tx.date?.seconds ? format(new Date(tx.date.seconds * 1000), 'MMM dd, yyyy') : 'Live'}
                </p>
                {tx.note && <p className="text-[10px] mt-2 text-white/40 italic font-medium">"{tx.note}"</p>}
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className={cn(
                "font-black text-xl tabular-nums italic",
                tx.type === 'income' ? "text-green-400" : "text-red-400"
              )}>
                {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-white/10 hover:text-red-400 hover:bg-red-400/10 transition-all rounded-xl">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="glass-dark rounded-[3.5rem] border-white/10 shadow-[0_0_100px_rgba(239,68,68,0.1)]">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-black text-glow">Purge Entry?</AlertDialogTitle>
                    <AlertDialogDescription className="font-bold text-white/60">
                      This will permanently delete this log from the Nexus database. This action is irreversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-3 mt-4">
                    <AlertDialogCancel className="rounded-2xl h-14 font-black glass border-white/10 hover:bg-white/10">Abort</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(tx.id)} className="bg-red-500 rounded-2xl h-14 font-black text-white hover:bg-red-600 shadow-xl">Execute Purge</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}

        {filteredTransactions.length === 0 && (
          <div className="text-center py-40 flex flex-col items-center gap-6">
            <div className="relative">
              <FileText className="h-20 w-20 text-white/5" />
              <div className="absolute inset-0 blur-2xl bg-primary/5 rounded-full" />
            </div>
            <p className="font-black uppercase tracking-[0.4em] text-xs text-white/20 italic">No data streams detected</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}