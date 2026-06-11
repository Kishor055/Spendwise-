'use server';
/**
 * @fileOverview Quantum Predictive Cash Flow Forecasting Flow.
 * Predicts balance, savings, and category-wise spending for 7, 30, and 90 days.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ForecastInputSchema = z.object({
  currentBalance: z.number(),
  transactions: z.array(z.object({
    amount: z.number(),
    type: z.string(),
    category: z.string(),
    date: z.string(),
  })),
  reminders: z.array(z.object({
    amount: z.number(),
    dueDate: z.string(),
    type: z.string()
  })),
  budgets: z.array(z.object({
    category: z.string(),
    limit: z.number()
  })).optional()
});

const ForecastOutputSchema = z.object({
  overallForecast: z.array(z.object({
    days: z.number(),
    predictedBalance: z.number(),
    predictedSavings: z.number(),
    confidence: z.number().describe('0 to 1 score'),
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH'])
  })),
  categoryPredictions: z.array(z.object({
    category: z.string(),
    predictedAmount: z.number(),
    trend: z.enum(['UP', 'DOWN', 'STABLE']),
    riskScore: z.number().describe('0 to 100')
  })),
  strategicInsight: z.string().describe('A high-level commercial insight about the upcoming cash flow.')
});

export async function getBalanceForecast(input: z.infer<typeof ForecastInputSchema>) {
  return predictiveForecastFlow(input);
}

const forecastPrompt = ai.definePrompt({
  name: 'predictiveForecastPrompt',
  input: { schema: ForecastInputSchema },
  output: { schema: ForecastOutputSchema },
  prompt: `You are the SpendWise Quantum Oracle, a state-of-the-art predictive financial engine. 
Analyze the user's historical spending DNA and upcoming commitments to project the future.

CURRENT STATE:
- Balance: ₹{{{currentBalance}}}

INPUT VECTORS:
- Transaction History: 
{{#each transactions}}
  - ₹{{{amount}}} ({{{type}}}) in {{{category}}} on {{{date}}}
{{/each}}

- Upcoming Commitments (Bills):
{{#each reminders}}
  - ₹{{{amount}}} due on {{{dueDate}}} (Type: {{{type}}})
{{/each}}

- Sector Limits (Budgets):
{{#each budgets}}
  - {{{category}}}: ₹{{{limit}}}
{{/each}}

MISSION:
1. Predict the account balance and savings for 7, 30, and 90 days.
2. Predict spending for EACH major category for the next 30 days based on recurring patterns.
3. Assign risk levels based on liquidity vs. predicted outflows.
4. Provide a "Confidence Score" (0.0 - 1.0) based on pattern consistency.
5. Generate a strategic commercial insight.

Use Indian Rupee (₹) context. Ensure predictions are statistically probable based on the provided history.`,
});

const predictiveForecastFlow = ai.defineFlow(
  {
    name: 'predictiveForecastFlow',
    inputSchema: ForecastInputSchema,
    outputSchema: ForecastOutputSchema,
  },
  async (input) => {
    const { output } = await forecastPrompt(input);
    return output!;
  }
);
