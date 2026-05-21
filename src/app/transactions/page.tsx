"use client";

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { BottomNav } from '@/components/layout/bottom-nav';
import { ArrowUpRight, ArrowDownRight, Search, Trash2, ChevronLeft, Download } from 'lucide-react';
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
    toast({ title: 'Purged', description: 'Log entry successfully removed from matrix.' });
  };

  const handleExport = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ['Date', 'Category', 'Type', 'Amount', 'Note'];
    const rows = filteredTransactions.map(tx => [
      tx.date?.seconds ? format(new Date(tx.date.seconds * 1000), 'yyyy-MM-dd') : 'Live',
      tx.category,
      tx.type,
      tx.amount,
      tx.note || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + 
      headers.join(",") + "\n" + 
      rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "spendwise_universal_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-44">
      <header className="px-8 py-10 bg-[#020617]/90 backdrop-blur-3xl sticky top-0 z-50 border-b border-white/10">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" className="rounded-2xl glass h-14 w-14" asChild>
              <Link href="/dashboard"><ChevronLeft className="h-7 w-7" /></Link>
            </Button>
            <h1 className="text-2xl font-black tracking-tighter italic">Universal History</h1>
          </div>
          <Button variant="ghost" size="icon" className="rounded-2xl glass h-14 w-14 text-accent" onClick={handleExport}>
            <Download className="h-7 w-7" />
          </Button>
        </div>

        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-3xl blur opacity-10 group-hover:opacity-30 transition duration-700"></div>
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
            <Input 
              placeholder="Query the Universal Logs..." 
              className="pl-16 h-16 rounded-[2rem] glass border-white/10 shadow-3xl text-base font-bold placeholder:text-white/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            {['all', 'income', 'expense'].map((f) => (
              <Button 
                key={f}
                variant={filter === f ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "rounded-full capitalize px-8 h-10 font-black text-[10px] tracking-[0.3em]",
                  filter === f ? "bg-primary text-white" : "bg-white/[0.03] text-white/40 border border-white/5"
                )}
                onClick={() => setFilter(f as any)}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <main className="px-8 pt-10 space-y-4 max-w-4xl mx-auto">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-20 opacity-20">
             <ReceiptText className="h-16 w-16 mx-auto mb-6" />
             <p className="font-black uppercase tracking-[0.4em] text-[10px]">No logs detected in this sector</p>
          </div>
        ) : (
          filteredTransactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-8 bg-white/[0.03] rounded-[2.5rem] border border-white/[0.05] transition-all hover:bg-white/[0.06] group">
              <div className="flex items-center gap-6">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center border border-white/5",
                  tx.type === 'income' ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                )}>
                  {tx.type === 'income' ? <ArrowUpRight className="h-7 w-7" /> : <ArrowDownRight className="h-7 w-7" />}
                </div>
                <div>
                  <p className="font-black text-lg text-white">{tx.category}</p>
                  <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em] mt-1">
                    {tx.date?.seconds ? format(new Date(tx.date.seconds * 1000), 'MMM dd, yyyy') : 'LIVE'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className={cn(
                  "font-black text-xl tabular-nums",
                  tx.type === 'income' ? "text-accent" : "text-white"
                )}>
                  {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-white/10 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#020617]/95 backdrop-blur-3xl rounded-[3rem] border-white/10 shadow-3xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-2xl font-black italic">Purge Log?</AlertDialogTitle>
                      <AlertDialogDescription className="text-white/40 text-sm font-medium">
                        This entry will be permanently removed from the universal history matrix.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-4 mt-6">
                      <AlertDialogCancel className="rounded-2xl h-14 font-black bg-white/[0.03] border-white/5 uppercase tracking-widest text-[10px]">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(tx.id)} className="bg-rose-600 rounded-2xl h-14 font-black text-white hover:bg-rose-700 uppercase tracking-widest text-[10px]">Purge</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))
        )}
      </main>

      <BottomNav />
    </div>
  );
}
