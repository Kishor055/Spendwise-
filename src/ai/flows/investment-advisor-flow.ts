'use server';
/**
 * @fileOverview Strategic Investment Recommendation Flow.
 * Analyzes spending DNA and liquidity to suggest professional portfolio allocations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const InvestmentInputSchema = z.object({
  income: z.number(),
  savings: z.number(),
  spendingHabits: z.array(z.object({
    category: z.string(),
    amount: z.number(),
  })),
  riskPreference: z.enum(['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE']).default('BALANCED'),
});

const InvestmentOutputSchema = z.object({
  investmentScore: z.number().describe('A score from 0-100 based on deployment potential.'),
  riskAnalysis: z.string().describe('Deep analysis of the user financial risk profile.'),
  portfolioSuggestions: z.array(z.object({
    assetClass: z.string().describe('e.g., Index Funds, Blue Chip Stocks, Gold, FD'),
    allocationPercentage: z.number(),
    expectedReturns: z.string(),
    reasoning: z.string(),
  })),
  sipRecommendations: z.array(z.object({
    fundType: z.string(),
    suggestedAmount: z.number(),
    timeHorizon: z.string(),
  })),
  strategicInsight: z.string().describe('A high-level commercial advice for wealth building.'),
});

export async function getInvestmentRecommendations(input: z.infer<typeof InvestmentInputSchema>) {
  return investmentAdvisorFlow(input);
}

const investmentPrompt = ai.definePrompt({
  name: 'investmentAdvisorPrompt',
  input: { schema: InvestmentInputSchema },
  output: { schema: InvestmentOutputSchema },
  prompt: `You are the SpendWise Strategic Wealth Advisor, a specialized agent in capital allocation and financial modeling.

INPUT VECTORS:
- Monthly Income: ₹{{{income}}}
- Liquid Savings: ₹{{{savings}}}
- Risk Profile: {{{riskPreference}}}
- Spending Patterns:
{{#each spendingHabits}}
  - {{{category}}}: ₹{{{amount}}}
{{/each}}

MISSION:
1. Calculate an "Investment Score" (0-100). High scores go to users with >30% savings rate.
2. Perform a "Risk Analysis" based on their spending volatility and stated preference.
3. Generate a "Portfolio Suggestion" using the Indian market context (Index Funds, ELSS, Large Cap, Gold, FD).
4. Provide specific "SIP Recommendations" that fit within their monthly surplus.
5. Provide a "Strategic Insight" on how to achieve 10x wealth growth in 10 years.

Tone: Analytical, elite, and authoritative. Use Indian Rupee (₹) symbols.`,
});

const investmentAdvisorFlow = ai.defineFlow(
  {
    name: 'investmentAdvisorFlow',
    inputSchema: InvestmentInputSchema,
    outputSchema: InvestmentOutputSchema,
  },
  async (input) => {
    const { output } = await investmentPrompt(input);
    return output!;
  }
);
