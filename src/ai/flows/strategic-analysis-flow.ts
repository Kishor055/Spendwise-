
'use server';
/**
 * @fileOverview Strategic Market Analysis Flow.
 * Provides commercial insights and simulated performance data for companies or sectors.
 * This flow acts as the bridge to our Python-powered Financial Core logic.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AnalysisInputSchema = z.object({
  entityName: z.string().describe('The name of the company or sector to analyze (e.g., "Nvidia" or "EV Sector").'),
});

const AnalysisOutputSchema = z.object({
  overview: z.string().describe('High-level commercial summary.'),
  marketSentiment: z.string().describe('Bullish or Bearish analysis.'),
  jobMarketImpact: z.string().describe('How this entity affects employment and career opportunities.'),
  commercialUse: z.string().describe('How businesses can leverage this entity for growth.'),
  performanceData: z.array(z.object({
    timestamp: z.string(),
    value: z.number(),
  })).describe('7 points of simulated performance data for visualization.'),
  professionalResilienceScore: z.number().describe('How relevant this entity is to a users career stability (1-100).'),
});

export async function getStrategicAnalysis(input: z.infer<typeof AnalysisInputSchema>) {
  return strategicAnalysisFlow(input);
}

const analysisPrompt = ai.definePrompt({
  name: 'analysisPrompt',
  input: { schema: AnalysisInputSchema },
  output: { schema: AnalysisOutputSchema },
  prompt: `You are the SpendWise Strategic Oracle. Analyze the following entity: {{{entityName}}}.

Your analysis should incorporate logic from the SpendWise Python Financial Core, focusing on market volatility and stochastic growth patterns.

Provide a professional, forward-looking analysis including:
1. A concise commercial overview.
2. Current market sentiment (based on simulated volatility metrics).
3. Impact on the job market (hiring trends, skill requirements).
4. Potential commercial use cases for enterprises.
5. Generate a series of 7 data points representing a simulated performance trend for the last 7 months (values between 100 and 1000).
6. Assign a Professional Resilience Score based on how essential this sector is to the modern economy.

Use a sophisticated, analytical tone. Ensure the output is structured for a high-end fintech terminal.`,
});

const strategicAnalysisFlow = ai.defineFlow(
  {
    name: 'strategicAnalysisFlow',
    inputSchema: AnalysisInputSchema,
    outputSchema: AnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await analysisPrompt(input);
    return output!;
  }
);
