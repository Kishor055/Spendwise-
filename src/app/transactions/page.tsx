"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { BottomNav } from '@/components/layout/bottom-nav';
import { ArrowUpRight, ArrowDownRight, Search, Trash2, Filter, ChevronLeft } from 'lucide-react';
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
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'users', user.uid, 'transactions'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction)));
    });

    return () => unsub();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
      toast({ title: 'Deleted', description: 'Transaction removed successfully' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete' });
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.category.toLowerCase().includes(search.toLowerCase()) || 
                          (tx.note && tx.note.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filter === 'all' || tx.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-6 pt-10 pb-6 sticky top-0 bg-background/80 backdrop-blur-lg z-30">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard"><ChevronLeft className="h-6 w-6" /></Link>
          </Button>
          <h1 className="text-2xl font-bold">Transaction History</h1>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search category or note..." 
              className="pl-10 h-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="h-11 w-11">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
          {['all', 'income', 'expense'].map((f) => (
            <Button 
              key={f}
              variant={filter === f ? 'default' : 'secondary'}
              size="sm"
              className="rounded-full capitalize px-6"
              onClick={() => setFilter(f as any)}
            >
              {f}
            </Button>
          ))}
        </div>
      </header>

      <main className="px-6 space-y-4 max-w-4xl mx-auto">
        {filteredTransactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between p-4 glass-card rounded-2xl group relative">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center",
                tx.type === 'income' ? "bg-[#43A047]/10 text-[#43A047]" : "bg-[#E53935]/10 text-[#E53935]"
              )}>
                {tx.type === 'income' ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
              </div>
              <div>
                <p className="font-bold">{tx.category}</p>
                <p className="text-xs text-muted-foreground">
                  {tx.date?.seconds ? format(new Date(tx.date.seconds * 1000), 'MMM dd, yyyy') : ''}
                </p>
                {tx.note && <p className="text-xs mt-1 text-muted-foreground line-clamp-1 italic">"{tx.note}"</p>}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={cn(
                "font-bold text-lg",
                tx.type === 'income' ? "text-[#43A047]" : "text-[#E53935]"
              )}>
                {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently remove the transaction from your history.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(tx.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}

        {filteredTransactions.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            No transactions found for your search/filter.
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}