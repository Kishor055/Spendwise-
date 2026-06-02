
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Upload, X } from 'lucide-react';
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
  expense: ['Food', 'Shopping', 'Travel', 'Recharge', 'Electricity', 'Fuel', 'Rent', 'EMI', 'Entertainment', 'Healthcare', 'Other'],
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
      amount: '' as unknown as number,
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
      
      toast({ title: 'Success', description: 'Transaction recorded in the matrix.' });
      form.reset({
        amount: '' as unknown as number,
        type: values.type,
        category: '',
        date: new Date(),
        note: '',
      });
      onSuccess?.();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to sync transaction' });
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
                        "px-8 py-3 rounded-2xl cursor-pointer transition-all border font-black uppercase text-[10px] tracking-widest",
                        field.value === 'expense' 
                          ? "bg-primary text-white border-primary shadow-xl shadow-primary/20" 
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
                        "px-8 py-3 rounded-2xl cursor-pointer transition-all border font-black uppercase text-[10px] tracking-widest",
                        field.value === 'income' 
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-xl shadow-emerald-500/20" 
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
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Quantifiable Amount</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-xl text-white/20">₹</span>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    step="0.01" 
                    className="pl-14 h-16 rounded-[2rem] glass border-white/10 text-2xl font-black placeholder:text-white/10"
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Sector</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-16 rounded-[2rem] glass border-white/10 font-bold px-6">
                      <SelectValue placeholder="Select Sector" />
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
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Temporal Point</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "h-16 rounded-[2rem] glass border-white/10 text-left font-bold px-6",
                          !field.value && "text-white/20"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick temporal point</span>
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
        </div>

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Matrix Note (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Encryption note..." 
                  className="h-16 rounded-[2rem] glass border-white/10 font-bold px-6 placeholder:text-white/10"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Evidence (Receipt)</Label>
          <div className="h-32 rounded-[2rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 group cursor-pointer hover:border-primary/40 transition-all hover:bg-white/[0.02]">
            <Upload className="h-6 w-6 text-white/20 group-hover:text-primary transition-colors" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Upload Receipt</span>
          </div>
        </div>

        <Button type="submit" className="w-full h-20 rounded-[2.5rem] bg-primary hover:bg-primary/80 text-white font-black text-xs uppercase tracking-[0.4em] shadow-2xl shadow-primary/20 transition-all active:scale-95" disabled={loading}>
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Execute Synchronization'}
        </Button>
      </form>
    </Form>
  );
}
