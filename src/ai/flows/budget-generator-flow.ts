'use server';
/**
 * @fileOverview Strategic Budget Generator.
 * Analyzes spending history to recommend optimized sector limits.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const BudgetGeneratorInputSchema = z.object({
  income: z.number(),
  spendingHistory: z.array(z.object({
    category: z.string(),
    amount: z.number(),
  })),
});

const BudgetGeneratorOutputSchema = z.object({
  recommendedBudgets: z.array(z.object({
    category: z.string(),
    limit: z.number(),
    priority: z.enum(['CRITICAL', 'FLEXIBLE', 'OPTIONAL']),
  })),
  strategy: z.string().describe('A high-level strategy for the user to achieve 20%+ savings.'),
});

export async function generateSmartBudgets(input: z.infer<typeof BudgetGeneratorInputSchema>) {
  return budgetGeneratorFlow(input);
}

const budgetPrompt = ai.definePrompt({
  name: 'budgetGeneratorPrompt',
  input: { schema: BudgetGeneratorInputSchema },
  output: { schema: BudgetGeneratorOutputSchema },
  prompt: `You are the SpendWise Strategic Architect. Based on the user's monthly income of ₹{{{income}}} and their recent spending patterns, generate a smart budget plan.

Spending History:
{{#each spendingHistory}}
- {{{category}}}: ₹{{{amount}}}
{{/each}}

Mission:
1. Ensure the total budget does not exceed 80% of income (20% savings rule).
2. Prioritize Rent, EMI, and Healthcare as CRITICAL.
3. Optimize Food and Entertainment for savings.
4. Provide a clear, actionable strategy.`,
});

const budgetGeneratorFlow = ai.defineFlow(
  {
    name: 'budgetGeneratorFlow',
    inputSchema: BudgetGeneratorInputSchema,
    outputSchema: BudgetGeneratorOutputSchema,
  },
  async (input) => {
    const { output } = await budgetPrompt(input);
    return output!;
  }
);
