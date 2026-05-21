
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

const transactionSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Category is required'),
  date: z.date(),
  note: z.string().optional(),
});

const CATEGORIES = {
  expense: ['Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Bills', 'Other'],
  income: ['Salary', 'Freelance', 'Gift', 'Investment', 'Other'],
};

export function TransactionForm({ onSuccess }: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: '' as unknown as number, // Initializing with empty string to avoid uncontrolled input error
      type: 'expense',
      category: '',
      date: new Date(),
      note: '',
    },
  });

  const transactionType = form.watch('type');

  async function onSubmit(values: z.infer<typeof transactionSchema>) {
    if (!user || !firestore) return;

    setLoading(true);
    try {
      const colRef = collection(firestore, 'users', user.uid, 'transactions');
      addDocumentNonBlocking(colRef, {
        ...values,
        userId: user.uid,
        date: Timestamp.fromDate(values.date),
        createdAt: serverTimestamp(),
      });
      
      toast({ title: 'Success', description: 'Transaction added successfully' });
      form.reset({
        amount: '' as unknown as number,
        type: values.type,
        category: '',
        date: new Date(),
        note: '',
      });
      onSuccess?.();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to initiate transaction' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="expense" id="expense" className="sr-only" />
                    <Label
                      htmlFor="expense"
                      className={cn(
                        "px-6 py-2 rounded-full cursor-pointer transition-all border font-black uppercase text-[10px] tracking-widest",
                        field.value === 'expense' 
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                          : "bg-white/[0.03] border-white/5 hover:bg-white/10 text-white/40"
                      )}
                    >
                      Expense
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="income" id="income" className="sr-only" />
                    <Label
                      htmlFor="income"
                      className={cn(
                        "px-6 py-2 rounded-full cursor-pointer transition-all border font-black uppercase text-[10px] tracking-widest",
                        field.value === 'income' 
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20" 
                          : "bg-white/[0.03] border-white/5 hover:bg-white/10 text-white/40"
                      )}
                    >
                      Income
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40">Amount</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-lg text-white/20">₹</span>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    step="0.01" 
                    className="pl-10 h-14 rounded-2xl glass border-white/10 text-xl font-black placeholder:text-white/10"
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40">Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-14 rounded-2xl glass border-white/10 font-bold">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="glass border-white/10 rounded-2xl">
                  {CATEGORIES[transactionType as keyof typeof CATEGORIES].map((cat) => (
                    <SelectItem key={cat} value={cat} className="font-bold text-sm">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40">Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "h-14 rounded-2xl glass border-white/10 text-left font-bold",
                        !field.value && "text-white/20"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-30" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 glass border-white/10" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40">Note (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Matrix note..." 
                  className="h-14 rounded-2xl glass border-white/10 font-bold placeholder:text-white/10"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full h-16 rounded-3xl bg-primary hover:bg-primary/80 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95" disabled={loading}>
          {loading && <Loader2 className="mr-3 h-4 w-4 animate-spin" />}
          Finalize Transaction
        </Button>
      </form>
    </Form>
  );
}
