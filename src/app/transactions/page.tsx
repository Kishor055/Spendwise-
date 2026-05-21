"use client";

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { BottomNav } from '@/components/layout/bottom-nav';
import { ArrowUpRight, ArrowDownRight, Search, Trash2, Filter, ChevronLeft, Download, FileText } from 'lucide-react';
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
    toast({ title: 'Deleted', description: 'Transaction removed from history' });
  };

  const handleExportCSV = () => {
    if (!filteredTransactions.length) {
      toast({ variant: 'destructive', title: 'No data', description: 'No records to export.' });
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
    link.setAttribute("download", `SpendWise_Export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: 'Export Successful', description: 'Your transaction history is ready.' });
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="px-6 pt-12 pb-6 sticky top-0 bg-background/50 backdrop-blur-xl z-50 border-b">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-2xl glass h-10 w-10" asChild>
              <Link href="/dashboard"><ChevronLeft className="h-5 w-5" /></Link>
            </Button>
            <h1 className="text-xl font-black tracking-tight">Financial History</h1>
          </div>
          <Button variant="ghost" size="icon" className="rounded-2xl glass h-10 w-10 text-primary" onClick={handleExportCSV}>
            <Download className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search history..." 
              className="pl-12 h-12 rounded-2xl glass border-none shadow-inner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {['all', 'income', 'expense'].map((f) => (
              <Button 
                key={f}
                variant={filter === f ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "rounded-full capitalize px-6 font-black text-[10px] tracking-widest",
                  filter === f ? "bg-primary shadow-lg" : "glass"
                )}
                onClick={() => setFilter(f as any)}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <main className="px-6 pt-8 space-y-4 max-w-4xl mx-auto">
        {filteredTransactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between p-6 glass rounded-[2.5rem] border-none shadow-sm group relative animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center",
                tx.type === 'income' ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
              )}>
                {tx.type === 'income' ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
              </div>
              <div>
                <p className="font-black text-sm">{tx.category}</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                  {tx.date?.seconds ? format(new Date(tx.date.seconds * 1000), 'MMM dd, yyyy') : ''}
                </p>
                {tx.note && <p className="text-[10px] mt-1 text-muted-foreground italic line-clamp-1 opacity-60">"{tx.note}"</p>}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={cn(
                "font-black text-base tabular-nums",
                tx.type === 'income' ? "text-green-600" : "text-red-600"
              )}>
                {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground/30 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="glass-dark rounded-[3rem] border-none shadow-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-black">Remove Record?</AlertDialogTitle>
                    <AlertDialogDescription className="font-bold opacity-70">
                      This will permanently delete this transaction from your history. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel className="rounded-2xl h-12 font-black">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(tx.id)} className="bg-destructive rounded-2xl h-12 font-black text-white hover:bg-destructive/90">Delete Forever</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}

        {filteredTransactions.length === 0 && (
          <div className="text-center py-32 opacity-30 italic font-black uppercase text-xs tracking-[0.2em] flex flex-col items-center gap-4">
            <FileText className="h-12 w-12" />
            No records found
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
