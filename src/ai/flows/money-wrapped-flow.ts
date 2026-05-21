
'use server';
/**
 * @fileOverview AI Money Wrapped Flow.
 * Generates a fun, personalized summary of user's financial habits.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const WrappedInputSchema = z.object({
  transactions: z.array(z.object({
    amount: z.number(),
    type: z.string(),
    category: z.string(),
    date: z.string()
  })),
  userName: z.string()
});

const WrappedOutputSchema = z.object({
  personality: z.string().describe('A catchy nickname like "The Gourmet Spender" or "Savings Sensei"'),
  summary: z.string().describe('A 2-sentence fun recap of the year/month.'),
  topCategory: z.string(),
  mostExpensiveDay: z.string(),
  funFact: z.string().describe('A surprising stat, e.g., "You spent 50% of your money on Tuesdays!"'),
  savingMantra: z.string().describe('A motivational quote for the user.')
});

export async function generateMoneyWrapped(input: z.infer<typeof WrappedInputSchema>) {
  return moneyWrappedFlow(input);
}

const wrappedPrompt = ai.definePrompt({
  name: 'wrappedPrompt',
  input: { schema: WrappedInputSchema },
  output: { schema: WrappedOutputSchema },
  prompt: `You are a fun, witty financial storyteller. Analyze the following transactions for {{{userName}}} and create a "Money Wrapped" style summary.

Recent Transactions:
{{#each transactions}}
- {{{type}}}: ₹{{{amount}}} in {{{category}}} on {{{date}}}
{{/each}}

Make it feel like a viral social media recap. Be encouraging but honest about their spending habits using Indian Rupee (₹) symbols. Be witty and use humor if they spend a lot on "Food" or "Entertainment".`,
});

const moneyWrappedFlow = ai.defineFlow(
  {
    name: 'moneyWrappedFlow',
    inputSchema: WrappedInputSchema,
    outputSchema: WrappedOutputSchema,
  },
  async (input) => {
    const { output } = await wrappedPrompt(input);
    return output!;
  }
);
