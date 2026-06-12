'use server';
/**
 * @fileOverview AI Executive Financial Report Flow.
 * Generates professional monthly financial statements and strategic summaries.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ReportInputSchema = z.object({
  userName: z.string(),
  month: z.string().describe('Month name, e.g., "October 2024"'),
  income: z.number(),
  expenses: z.number(),
  transactions: z.array(z.object({
    category: z.string(),
    amount: z.number(),
    type: z.string(),
  })),
  healthScore: z.number(),
});

const ReportOutputSchema = z.object({
  executiveSummary: z.string().describe('A high-level summary for a commercial professional.'),
  sectorPerformance: z.array(z.object({
    category: z.string(),
    analysis: z.string(),
    efficiency: z.enum(['OPTIMAL', 'SUBOPTIMAL', 'CRITICAL']),
  })),
  savingsWins: z.array(z.string()).describe('Specific instances of financial discipline found in logs.'),
  strategicForecast: z.string().describe('Guidance for the upcoming month based on historical DNA.'),
});

export async function generateMonthlyReport(input: z.infer<typeof ReportInputSchema>) {
  return monthlyReportFlow(input);
}

const reportPrompt = ai.definePrompt({
  name: 'monthlyReportPrompt',
  input: { schema: ReportInputSchema },
  output: { schema: ReportOutputSchema },
  prompt: `You are the SpendWise Strategic Auditor. Generate an Executive Financial Report for {{{userName}}} for {{{month}}}.

INPUT VECTORS:
- Total Inflow: ₹{{{income}}}
- Total Outflow: ₹{{{expenses}}}
- Vitality Index: {{{healthScore}}}/100

MISSION:
1. Provide a professional, analytical summary of their monthly performance.
2. Identify "Efficiency Leaks" in specific sectors (categories).
3. Highlight "Savings Wins" where they showed executive-level discipline.
4. Provide a forward-looking "Strategic Forecast" to improve their Professional Burn Rate.

Tone: Professional, high-authority, elite fintech terminal style. Use Indian Rupee (₹).`,
});

const monthlyReportFlow = ai.defineFlow(
  {
    name: 'monthlyReportFlow',
    inputSchema: ReportInputSchema,
    outputSchema: ReportOutputSchema,
  },
  async (input) => {
    const { output } = await reportPrompt(input);
    return output!;
  }
);
