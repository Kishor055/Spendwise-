'use server';
/**
 * @fileOverview Strategic Wealth & RAG Intelligence Flow.
 * Correlates holistic SpendWise data with commercial job market insights.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const FinancialAdvisorInputSchema = z.object({
  query: z.string(),
  transactions: z.array(z.object({
    amount: z.number(),
    type: z.string(),
    category: z.string(),
    date: z.string(),
    note: z.string().optional()
  })),
  budgets: z.array(z.object({
    category: z.string(),
    limit: z.number()
  })).optional(),
  goals: z.array(z.object({
    title: z.string(),
    targetAmount: z.number(),
    currentAmount: z.number()
  })).optional(),
  userProfile: z.object({
    name: z.string(),
    monthlyBudget: z.number(),
    rank: z.string().optional()
  })
});

const FinancialAdvisorOutputSchema = z.object({
  answer: z.string(),
  strategicAction: z.string().describe('A high-level commercial or career move based on finances.'),
  efficiencyRating: z.number().describe('A score from 1-100 on financial stability.'),
  marketCorrelation: z.string().describe('How these habits affect job market standing or commercial viability.')
});

export async function askFinancialAdvisor(input: z.infer<typeof FinancialAdvisorInputSchema>) {
  return financialAdvisorFlow(input);
}

const financialAdvisorPrompt = ai.definePrompt({
  name: 'strategicWealthPrompt',
  input: { schema: FinancialAdvisorInputSchema },
  output: { schema: FinancialAdvisorOutputSchema },
  prompt: `You are the SpendWise Strategic Oracle. You have retrieved the following entity data for a holistic RAG analysis.

User Profile: {{{userProfile.name}}} (Rank: {{{userProfile.rank}}})
Total Monthly Matrix Budget: ₹{{{userProfile.monthlyBudget}}}

Active Sector Limits (Budgets):
{{#each budgets}}
- {{{category}}}: Limit ₹{{{limit}}}
{{/each}}

Strategic Manifestation Goals:
{{#each goals}}
- {{{title}}}: Target ₹{{{targetAmount}}} (Current: ₹{{{currentAmount}}})
{{/each}}

Temporal Transaction History:
{{#each transactions}}
- {{{type}}}: ₹{{{amount}}} in {{{category}}} on {{{date}}} {{#if note}}[{{{note}}}]{{/if}}
{{/each}}

User Query: {{{query}}}

MISSION:
1. Provide a professional, deep-space analysis using Indian Rupee (₹).
2. Correlate their spending habits with "Commercial Professionalism". For example, high impulse spending might indicate lower professional stability, whereas high goal-manifestation shows executive-level discipline.
3. Suggest how reducing specific expenses can increase their "Professional Burn Rate" (how long they can survive without income) to better navigate the Job Market.
4. Give an efficiency rating (1-100).`,
});

const financialAdvisorFlow = ai.defineFlow(
  {
    name: 'financialAdvisorFlow',
    inputSchema: FinancialAdvisorInputSchema,
    outputSchema: FinancialAdvisorOutputSchema,
  },
  async (input) => {
    const { output } = await financialAdvisorPrompt(input);
    return output!;
  }
);
