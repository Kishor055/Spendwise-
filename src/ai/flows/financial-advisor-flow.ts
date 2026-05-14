
'use server';
/**
 * @fileOverview AI Financial Advisor Flow.
 * Provides personalized financial advice based on user transactions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FinancialAdvisorInputSchema = z.object({
  query: z.string(),
  transactions: z.array(z.object({
    amount: z.number(),
    type: z.string(),
    category: z.string(),
    date: z.string(),
    note: z.string().optional()
  })),
  userProfile: z.object({
    name: z.string(),
    monthlyBudget: z.number()
  })
});

const FinancialAdvisorOutputSchema = z.object({
  answer: z.string(),
  recommendations: z.array(z.string()).optional(),
  savingTip: z.string().optional()
});

export async function askFinancialAdvisor(input: z.infer<typeof FinancialAdvisorInputSchema>) {
  return financialAdvisorFlow(input);
}

const financialAdvisorPrompt = ai.definePrompt({
  name: 'financialAdvisorPrompt',
  input: { schema: FinancialAdvisorInputSchema },
  output: { schema: FinancialAdvisorOutputSchema },
  prompt: `You are Spendwise AI, a professional financial advisor.
User Name: {{{userProfile.name}}}
Monthly Budget: ${{{userProfile.monthlyBudget}}}

Recent Transactions:
{{#each transactions}}
- {{{type}}}: ${{{amount}}} in {{{category}}} ({{{date}}}) {{#if note}}Note: {{{note}}}{{/if}}
{{/each}}

User Question: {{{query}}}

Provide a helpful, concise, and professional response. Analyze their spending patterns if relevant to the question. Suggest specific ways to save or better manage their budget based on their data.`,
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
