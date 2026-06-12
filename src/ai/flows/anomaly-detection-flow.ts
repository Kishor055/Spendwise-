'use server';
/**
 * @fileOverview Neural Anomaly & Fraud Detection Flow.
 * Identifies unusual spending patterns and potential "Matrix Errors" (Fraud).
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AnomalyInputSchema = z.object({
  transactions: z.array(z.object({
    id: z.string(),
    amount: z.number(),
    merchant: z.string().optional(),
    category: z.string(),
    date: z.string(),
  })),
  typicalDailySpend: z.number().optional().default(1000),
});

const AnomalyOutputSchema = z.object({
  anomalies: z.array(z.object({
    transactionId: z.string(),
    reason: z.string(),
    riskScore: z.number().describe('0 to 100'),
    severity: z.enum(['LOW', 'MEDIUM', 'CRITICAL']),
  })),
  patternAnalysis: z.string().describe('Summary of the user spending patterns vs current outliers.'),
  overallRiskLevel: z.enum(['STABLE', 'VOLATILE', 'COMPROMISED']),
});

export async function detectAnomalies(input: z.infer<typeof AnomalyInputSchema>) {
  return anomalyDetectionFlow(input);
}

const anomalyPrompt = ai.definePrompt({
  name: 'anomalyDetectionPrompt',
  input: { schema: AnomalyInputSchema },
  output: { schema: AnomalyOutputSchema },
  prompt: `You are the SpendWise Neural Guardian. Your mission is to detect anomalies and potential fraud in the financial matrix.

CONTEXT:
Typical Daily Spend: ₹{{{typicalDailySpend}}}

INPUT VECTORS (Recent Transactions):
{{#each transactions}}
- ID: {{{id}}}, Merchant: {{{merchant}}}, Amount: ₹{{{amount}}}, Category: {{{category}}}, Date: {{{date}}}
{{/each}}

MISSION:
1. Identify "Pattern Breaks": Transactions that are significantly higher than the typical daily spend (e.g., 5x or more).
2. Detect "Frequency Anomalies": Multiple transactions at the same merchant in a very short time.
3. Assess "Category Risk": A large expense in "Entertainment" or "Other" is riskier than "Rent" or "Healthcare".
4. Assign a Risk Score (0-100) and Severity.
5. Provide a sophisticated pattern analysis summary.

Tone: Analytical, authoritative, and security-focused.`,
});

const anomalyDetectionFlow = ai.defineFlow(
  {
    name: 'anomalyDetectionFlow',
    inputSchema: AnomalyInputSchema,
    outputSchema: AnomalyOutputSchema,
  },
  async (input) => {
    const { output } = await anomalyPrompt(input);
    return output!;
  }
);
