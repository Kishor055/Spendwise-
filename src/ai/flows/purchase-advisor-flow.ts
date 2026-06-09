'use server';
/**
 * @fileOverview AI Purchase Decision Engine.
 * Evaluates the impact of a potential purchase on user's financial health.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const PurchaseInputSchema = z.object({
  itemName: z.string(),
  price: z.number(),
  transactions: z.array(z.object({
    amount: z.number(),
    type: z.string(),
    category: z.string(),
  })),
  budgets: z.array(z.object({
    category: z.string(),
    limit: z.number()
  })),
  goals: z.array(z.object({
    title: z.string(),
    targetAmount: z.number(),
    currentAmount: z.number()
  }))
});

const PurchaseOutputSchema = z.object({
  decision: z.enum(['BUY', 'WAIT', 'AVOID']),
  reasoning: z.string(),
  budgetImpact: z.number().describe('A score from 1-100 of how much this impacts the monthly budget.'),
  goalDelay: z.string().describe('Estimate of how much this delays the primary goal.'),
  alternative: z.string().describe('A cheaper alternative or a strategic suggestion.')
});

export async function advisePurchase(input: z.infer<typeof PurchaseInputSchema>) {
  return purchaseAdvisorFlow(input);
}

const purchasePrompt = ai.definePrompt({
  name: 'purchaseAdvisorPrompt',
  input: { schema: PurchaseInputSchema },
  output: { schema: PurchaseOutputSchema },
  prompt: `You are the SpendWise AI Financial Twin. A version of the user that is 10x more disciplined.

USER INTENT: Wants to buy "{{{itemName}}}" for ₹{{{price}}}.

FINANCIAL MATRIX:
- Recent History: {{#each transactions}} ₹{{{amount}}} ({{{category}}}) {{/each}}
- Sector Limits: {{#each budgets}} {{{category}}}: ₹{{{limit}}} {{/each}}
- Manifestation Goals: {{#each goals}} {{{title}}}: Target ₹{{{targetAmount}}} (Current: ₹{{{currentAmount}}}) {{/each}}

MISSION:
Evaluate if this purchase is a "Matrix Error" or a "Strategic Acquisition".
1. If they have already spent 80% of their budget, be firm.
2. If this purchase delays their manifest goal significantly, explain why they should WAIT.
3. Calculate a budget impact score (100 = catastrophic, 1 = negligible).
4. Provide a witty, twin-like advice.`,
});

const purchaseAdvisorFlow = ai.defineFlow(
  {
    name: 'purchaseAdvisorFlow',
    inputSchema: PurchaseInputSchema,
    outputSchema: PurchaseOutputSchema,
  },
  async (input) => {
    const { output } = await purchasePrompt(input);
    return output!;
  }
);
