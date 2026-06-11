"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Upload, Sparkles, AlertCircle } from 'lucide-react';
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
import { categorizeTransaction } from '@/ai/flows/ai-categorization-flow';

const transactionSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Category is required'),
  date: z.date(),
  note: z.string().optional(),
  merchant: z.string().optional(),
});

const CATEGORIES = {
  expense: ['Food', 'Shopping', 'Travel', 'Recharge', 'Electricity', 'Fuel', 'Rent', 'EMI', 'Entertainment', 'Healthcare', 'Other'],
  income: ['Salary', 'Freelance', 'Gift', 'Investment', 'Other'],
};

export function TransactionForm({ onSuccess }: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: 0,
      type: 'expense',
      category: '',
      date: new Date(),
      note: '',
      merchant: '',
    },
  });

  const transactionType = form.watch('type');
  const merchantName = form.watch('merchant');

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (merchantName && merchantName.length > 2 && transactionType === 'expense') {
        setIsCategorizing(true);
        try {
          const result = await categorizeTransaction({ description: merchantName });
          form.setValue('category', result.category);
          setAiConfidence(result.confidence);
        } catch (e) {
          console.error("Categorization failed", e);
        } finally {
          setIsCategorizing(false);
        }
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [merchantName, transactionType, form]);

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
        aiCategorized: !!aiConfidence,
        confidence: aiConfidence || 0,
      });
      
      toast({ title: 'Protocol Executed', description: 'Transaction manifest synchronized.' });
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Neural Error', description: 'Failed to sync with matrix.' });
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
                      Outflow
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
                      Inflow
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="merchant"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Merchant / Entity</FormLabel>
                <FormControl>
                  <div className="relative">
                     <Input 
                      placeholder="e.g. Swiggy, Uber" 
                      className="h-16 rounded-[2rem] glass border-white/10 font-bold px-6 placeholder:text-white/10"
                      {...field}
                    />
                    {isCategorizing && (
                       <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-accent" />
                    )}
                  </div>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Quantifiable Value</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-xl text-white/20">₹</span>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      className="pl-14 h-16 rounded-[2rem] glass border-white/10 text-2xl font-black"
                      {...field}
                    />
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 flex items-center gap-2">
                  Sector
                  {aiConfidence && (
                    <span className="text-[8px] bg-accent/10 text-accent px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                      <Sparkles className="h-2 w-2" /> AI Suggested
                    </span>
                  )}
                </FormLabel>
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
                        className={cn("h-16 rounded-[2rem] glass border-white/10 text-left font-bold px-6", !field.value && "text-white/20")}
                      >
                        {field.value ? format(field.value, "PPP") : "Temporal Data"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-30" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 glass border-white/10" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Matrix Note</FormLabel>
              <FormControl>
                <Input placeholder="Additional metadata..." className="h-16 rounded-[2rem] glass border-white/10 font-bold px-6" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full h-20 rounded-[2.5rem] bg-primary text-white font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-95" disabled={loading}>
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Execute Synchronization'}
        </Button>
      </form>
    </Form>
  );
}
