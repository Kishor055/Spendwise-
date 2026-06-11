'use server';
/**
 * @fileOverview AI Subscription Intelligence Flow.
 * Scans transactions to detect recurring patterns indicating subscriptions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SubscriptionInputSchema = z.object({
  transactions: z.array(z.object({
    merchant: z.string().optional(),
    category: z.string(),
    amount: z.number(),
    date: z.string()
  })),
});

const SubscriptionOutputSchema = z.object({
  detectedSubscriptions: z.array(z.object({
    name: z.string(),
    amount: z.number(),
    cycle: z.enum(['monthly', 'yearly']),
    confidence: z.number(),
    nextRenewalEstimate: z.string()
  })),
  annualLeakAmount: z.number().describe('Total projected annual cost of detected subscriptions.')
});

export async function analyzeSubscriptions(input: z.infer<typeof SubscriptionInputSchema>) {
  return subscriptionAnalyzerFlow(input);
}

const subPrompt = ai.definePrompt({
  name: 'subscriptionAnalyzerPrompt',
  input: { schema: SubscriptionInputSchema },
  output: { schema: SubscriptionOutputSchema },
  prompt: `You are the SpendWise Neural Subscription Detector. Analyze these transactions to find recurring monthly or yearly charges.

Transactions:
{{#each transactions}}
- {{{merchant}}}: ₹{{{amount}}} on {{{date}}} ({{{category}}})
{{/each}}

Look for:
1. Identical amounts from the same merchant appearing at regular intervals.
2. Common subscription names (Netflix, Spotify, Prime, etc.).
3. Calculate the total annual cost of all these subscriptions.`,
});

const subscriptionAnalyzerFlow = ai.defineFlow(
  {
    name: 'subscriptionAnalyzerFlow',
    inputSchema: SubscriptionInputSchema,
    outputSchema: SubscriptionOutputSchema,
  },
  async (input) => {
    const { output } = await subPrompt(input);
    return output!;
  }
);
