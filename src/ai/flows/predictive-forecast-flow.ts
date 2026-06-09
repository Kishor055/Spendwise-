'use server';
/**
 * @fileOverview Predictive Cash Flow Forecasting Flow.
 * Predicts balance for 7, 30, and 90 days based on patterns.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ForecastInputSchema = z.object({
  currentBalance: z.number(),
  transactions: z.array(z.object({
    amount: z.number(),
    type: z.string(),
    date: z.string(),
  })),
  reminders: z.array(z.object({
    amount: z.number(),
    dueDate: z.string(),
  }))
});

const ForecastOutputSchema = z.object({
  forecast: z.array(z.object({
    days: z.number(),
    predictedBalance: z.number(),
    confidence: z.number(),
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH'])
  })),
  insight: z.string().describe('A short AI insight about the upcoming cash flow.')
});

export async function getBalanceForecast(input: z.infer<typeof ForecastInputSchema>) {
  return predictiveForecastFlow(input);
}

const forecastPrompt = ai.definePrompt({
  name: 'predictiveForecastPrompt',
  input: { schema: ForecastInputSchema },
  output: { schema: ForecastOutputSchema },
  prompt: `You are the SpendWise Quantum Oracle. Analyze the user's temporal financial data to predict the future.

CURRENT STATE:
- Balance: ₹{{{currentBalance}}}

INPUT VECTORS:
- History: {{#each transactions}} ₹{{{amount}}} on {{{date}}} {{/each}}
- Upcoming Commitments: {{#each reminders}} ₹{{{amount}}} due on {{{dueDate}}} {{/each}}

MISSION:
Predict the user's account balance at exactly 7, 30, and 90 days from now.
- Consider recurring patterns.
- Account for the upcoming bills.
- Assess risk level based on burn rate vs liquidity.`,
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
