'use server';
/**
 * @fileOverview Quantum Financial Health Scoring Engine.
 * Calculates a 0-100 score based on savings rate, budget adherence, and liquidity.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const HealthScoreInputSchema = z.object({
  income: z.number(),
  expenses: z.number(),
  budgets: z.array(z.object({
    category: z.string(),
    limit: z.number(),
    spent: z.number(),
  })),
  emergencyFund: z.number(),
  totalDebt: z.number().optional().default(0),
});

const HealthScoreOutputSchema = z.object({
  score: z.number().describe('Overall health score from 0 to 100.'),
  riskLevel: z.enum(['EXCELLENT', 'GOOD', 'AVERAGE', 'POOR']),
  metrics: z.object({
    savingsRate: z.number(),
    budgetAdherence: z.number(),
    debtToIncome: z.number(),
    emergencyFundStatus: z.string(),
  }),
  recommendations: z.array(z.string()),
  strategicInsight: z.string().describe('A high-level commercial insight.'),
});

export async function getFinancialHealthScore(input: z.infer<typeof HealthScoreInputSchema>) {
  return financialHealthFlow(input);
}

const healthPrompt = ai.definePrompt({
  name: 'healthScorePrompt',
  input: { schema: HealthScoreInputSchema },
  output: { schema: HealthScoreOutputSchema },
  prompt: `You are the SpendWise Strategic Auditor. Analyze the following financial matrix:

INPUT VECTORS:
- Monthly Income: ₹{{{income}}}
- Total Expenses: ₹{{{expenses}}}
- Emergency Buffer: ₹{{{emergencyFund}}}
- Total Debt: ₹{{{totalDebt}}}

SECTOR LIMITS:
{{#each budgets}}
- {{{category}}}: Limit ₹{{{limit}}}, Spent ₹{{{spent}}}
{{/each}}

MISSION:
1. Calculate a "Vitality Score" (0-100). 
   - 90+ is EXCELLENT (high savings, 100% budget adherence).
   - 70-89 is GOOD.
   - 50-69 is AVERAGE.
   - Below 50 is POOR.
2. Evaluate "Budget Adherence": How many sectors exceeded their limits?
3. Calculate "Savings Rate": (Income - Expenses) / Income.
4. Emergency Fund Status: Is the buffer enough for 3-6 months of expenses?
5. Generate 3 surgical recommendations to improve the score.
6. Provide a professional, commercial-grade strategic insight.

Tone: Sophisticated, analytical, and authoritative.`,
});

const financialHealthFlow = ai.defineFlow(
  {
    name: 'financialHealthFlow',
    inputSchema: HealthScoreInputSchema,
    outputSchema: HealthScoreOutputSchema,
  },
  async (input) => {
    const { output } = await healthPrompt(input);
    return output!;
  }
);
