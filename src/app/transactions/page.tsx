"use client";

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { BottomNav } from '@/components/layout/bottom-nav';
import { ArrowUpRight, ArrowDownRight, Search, Trash2, ChevronLeft, Download, Terminal } from 'lucide-react';
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
    toast({ title: 'Purged', description: 'Log entry successfully removed.' });
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-32">
      <header className="px-6 pt-10 pb-6 sticky top-0 bg-[#020617]/90 backdrop-blur-2xl z-50 border-b border-white/5">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-xl glass h-10 w-10" asChild>
              <Link href="/dashboard"><ChevronLeft className="h-5 w-5" /></Link>
            </Button>
            <h1 className="text-xl font-black italic tracking-tighter">Nexus Logs</h1>
          </div>
          <Button variant="ghost" size="icon" className="rounded-xl glass h-10 w-10 text-accent hover:bg-white/5">
            <Download className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <Input 
              placeholder="Search data..." 
              className="pl-11 h-12 rounded-xl glass border-white/10 bg-white/[0.02]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            {['all', 'income', 'expense'].map((f) => (
              <Button 
                key={f}
                variant={filter === f ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "rounded-full capitalize px-5 h-8 font-black text-[9px] tracking-widest",
                  filter === f ? "bg-primary text-white" : "glass border-white/5"
                )}
                onClick={() => setFilter(f as any)}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <main className="px-6 pt-6 space-y-3 max-w-4xl mx-auto">
        {filteredTransactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between p-5 glass rounded-[2rem] border-white/5 transition-all hover:bg-white/[0.05] group">
            <div className="flex items-center gap-5">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-105",
                tx.type === 'income' ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
              )}>
                {tx.type === 'income' ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
              </div>
              <div>
                <p className="font-bold text-sm text-white/90">{tx.category}</p>
                <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mt-0.5">
                  {tx.date?.seconds ? format(new Date(tx.date.seconds * 1000), 'MMM dd, yyyy') : 'Live'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={cn(
                "font-black text-base tabular-nums",
                tx.type === 'income' ? "text-green-400" : "text-white"
              )}>
                {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white/10 hover:text-red-400 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="glass-dark rounded-[2.5rem] border-white/10">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-black italic">Purge Log?</AlertDialogTitle>
                    <AlertDialogDescription className="text-white/60 text-sm">
                      This entry will be permanently removed from the Nexus stream.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2 mt-4">
                    <AlertDialogCancel className="rounded-xl h-12 font-black glass border-white/10">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(tx.id)} className="bg-red-500 rounded-xl h-12 font-black text-white hover:bg-red-600">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </main>

      <BottomNav />
    </div>
  );
}