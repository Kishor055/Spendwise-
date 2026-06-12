
"use client";

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, writeBatch } from 'firebase/firestore';
import { BottomNav } from '@/components/layout/bottom-nav';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Trash2, 
  ChevronLeft, 
  Download, 
  ReceiptText,
  CheckSquare,
  Square,
  MoreVertical,
  Filter,
  CheckCircle2,
  XCircle,
  ShieldAlert
} from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from 'framer-motion';

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: any;
  note?: string;
  merchant?: string;
}

export default function TransactionsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { toast } = useToast();

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc'));
  }, [firestore, user]);

  const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(tx => {
      const matchesSearch = 
        tx.category.toLowerCase().includes(search.toLowerCase()) || 
        (tx.note && tx.note.toLowerCase().includes(search.toLowerCase())) ||
        (tx.merchant && tx.merchant.toLowerCase().includes(search.toLowerCase()));
      const matchesFilter = filter === 'all' || tx.type === filter;
      return matchesSearch && matchesFilter;
    });
  }, [transactions, search, filter]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredTransactions.length) setSelectedIds([]);
    else setSelectedIds(filteredTransactions.map(t => t.id));
  };

  const handleDelete = async (ids: string[]) => {
    if (!user || !firestore || ids.length === 0) return;
    
    // For single delete, use existing utility
    if (ids.length === 1) {
      const docRef = doc(firestore, 'users', user.uid, 'transactions', ids[0]);
      deleteDocumentNonBlocking(docRef);
    } else {
      // Bulk delete simulation (in a real app we'd use a batch)
      ids.forEach(id => {
        const docRef = doc(firestore, 'users', user.uid, 'transactions', id);
        deleteDocumentNonBlocking(docRef);
      });
    }
    
    setSelectedIds([]);
    toast({ title: 'Matrix Purge Executed', description: `${ids.length} entries removed from universal history.` });
  };

  const handleExport = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ['Date', 'Category', 'Merchant', 'Type', 'Amount', 'Note'];
    const rows = filteredTransactions.map(tx => [
      tx.date?.seconds ? format(new Date(tx.date.seconds * 1000), 'yyyy-MM-dd') : 'Live',
      tx.category,
      tx.merchant || '',
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
    link.setAttribute("download", `spendwise_audit_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-44 selection:bg-primary/30">
      <header className="px-8 py-10 bg-[#020617]/90 backdrop-blur-3xl sticky top-0 z-50 border-b border-white/5">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" className="rounded-2xl glass h-14 w-14" asChild>
              <Link href="/dashboard"><ChevronLeft className="h-7 w-7" /></Link>
            </Button>
            <div>
              <h1 className="text-2xl font-black tracking-tighter italic">Universal History</h1>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 mt-1">Audit Log v4.0</p>
            </div>
          </div>
          <div className="flex gap-3">
             {selectedIds.length > 0 && (
               <Button variant="destructive" size="sm" className="rounded-2xl px-6 h-14 font-black uppercase text-[10px] tracking-widest shadow-2xl" onClick={() => handleDelete(selectedIds)}>
                  Purge {selectedIds.length}
               </Button>
             )}
             <Button variant="ghost" size="icon" className="rounded-2xl glass h-14 w-14 text-accent" onClick={handleExport}>
               <Download className="h-7 w-7" />
             </Button>
          </div>
        </div>

        <div className="space-y-6 max-w-5xl mx-auto">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-[2.5rem] blur opacity-10 group-hover:opacity-30 transition duration-700"></div>
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
            <Input 
              placeholder="Query the Matrix Logs (Merchant, Sector, Notes)..." 
              className="pl-16 h-16 rounded-[2rem] glass border-white/10 shadow-3xl text-base font-bold placeholder:text-white/10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide">
              {['all', 'income', 'expense'].map((f) => (
                <Button 
                  key={f}
                  variant={filter === f ? 'default' : 'ghost'}
                  className={cn(
                    "rounded-full capitalize px-8 h-10 font-black text-[9px] tracking-[0.4em] border transition-all",
                    filter === f ? "bg-primary text-white border-primary shadow-xl shadow-primary/20" : "bg-white/[0.03] text-white/40 border-white/5"
                  )}
                  onClick={() => setFilter(f as any)}
                >
                  {f}
                </Button>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white" onClick={toggleSelectAll}>
               {selectedIds.length === filteredTransactions.length ? "Deselect All" : "Select All Visible"}
            </Button>
          </div>
        </div>
      </header>

      <main className="px-8 pt-10 space-y-4 max-w-5xl mx-auto">
        {isLoading ? (
           <div className="py-32 flex flex-col items-center justify-center text-white/10">
              <Loader2 className="h-12 w-12 animate-spin mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.5em]">Synchronizing Matrix...</p>
           </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-32 opacity-10 flex flex-col items-center gap-6">
             <ReceiptText className="h-24 w-24" />
             <p className="font-black uppercase tracking-[0.5em] text-[10px]">No Neural Records Identified</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredTransactions.map((tx, idx) => {
              const isSelected = selectedIds.includes(tx.id);
              return (
                <motion.div 
                  key={tx.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "flex items-center gap-6 p-8 rounded-[2.5rem] border transition-all hover:bg-white/[0.04] group relative overflow-hidden",
                    isSelected ? "bg-primary/5 border-primary/40" : "bg-white/[0.02] border-white/5"
                  )}
                >
                  <button 
                    onClick={() => toggleSelect(tx.id)}
                    className={cn(
                      "h-6 w-6 rounded-lg border flex items-center justify-center transition-all",
                      isSelected ? "bg-primary border-primary text-white" : "border-white/10 bg-white/5 text-transparent group-hover:text-white/20"
                    )}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>

                  <div className="flex-1 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                      <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform shadow-xl",
                        tx.type === 'income' ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"
                      )}>
                        {tx.type === 'income' ? <ArrowUpRight className="h-8 w-8" /> : <ArrowDownRight className="h-8 w-8" />}
                      </div>
                      <div>
                        <p className="font-black text-xl italic text-white tracking-tight">{tx.merchant || tx.category}</p>
                        <div className="flex items-center gap-4 mt-1">
                           <span className="text-[9px] text-white/40 font-black uppercase tracking-widest">{tx.category}</span>
                           <span className="h-1 w-1 rounded-full bg-white/10" />
                           <span className="text-[9px] text-white/20 font-black uppercase tracking-widest">
                             {tx.date?.seconds ? format(new Date(tx.date.seconds * 1000), 'MMM dd, yyyy') : 'LIVE'}
                           </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <div className={cn(
                          "font-black text-2xl tabular-nums italic tracking-tighter",
                          tx.type === 'income' ? "text-emerald-400" : "text-white"
                        )}>
                          {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                        </div>
                        {tx.note && <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-1 max-w-[150px] truncate">{tx.note}</p>}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-12 w-12 text-white/10 hover:text-white rounded-2xl hover:bg-white/5">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#020617]/95 backdrop-blur-3xl rounded-2xl border-white/10 shadow-3xl w-56">
                          <DropdownMenuItem className="p-4 font-black uppercase text-[9px] tracking-widest text-white/60 hover:text-white transition-colors cursor-pointer">
                            View Vector Metadata
                          </DropdownMenuItem>
                          <DropdownMenuItem className="p-4 font-black uppercase text-[9px] tracking-widest text-white/60 hover:text-white transition-colors cursor-pointer">
                            Duplicate Log
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="p-4 font-black uppercase text-[9px] tracking-widest text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                            onClick={() => handleDelete([tx.id])}
                          >
                            Purge Log
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
