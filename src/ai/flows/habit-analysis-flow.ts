'use server';
/**
 * @fileOverview AI Spending DNA & Habit Analysis Flow.
 * Identifies behavioral patterns and spending personalities.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const HabitInputSchema = z.object({
  transactions: z.array(z.object({
    merchant: z.string().optional(),
    category: z.string(),
    amount: z.number(),
    date: z.string(),
  })),
});

const HabitOutputSchema = z.object({
  spendingPersonality: z.string().describe('A title like "The Strategic Saver" or "The Impulse Voyager".'),
  behavioralPatterns: z.array(z.object({
    pattern: z.string(),
    insight: z.string(),
    impact: z.enum(['POSITIVE', 'NEGATIVE', 'NEUTRAL']),
  })),
  peakSpendingHours: z.string().describe('e.g., "Late Night (11 PM - 2 AM)"'),
  topMerchantObsession: z.string().describe('The entity where the user spends most frequently.'),
  improvementProtocol: z.string().describe('A surgical suggestion to fix a negative habit.'),
});

export async function analyzeSpendingDNA(input: z.infer<typeof HabitInputSchema>) {
  return habitAnalysisFlow(input);
}

const habitPrompt = ai.definePrompt({
  name: 'habitAnalysisPrompt',
  input: { schema: HabitInputSchema },
  output: { schema: HabitOutputSchema },
  prompt: `You are the SpendWise Neural Profiler. Analyze the following transaction history to decode the user's Spending DNA.

INPUT VECTORS (Universal History):
{{#each transactions}}
- {{{merchant}}} ({{{category}}}): ₹{{{amount}}} on {{{date}}}
{{/each}}

MISSION:
1. Identify behavioral patterns (e.g., "Weekend Spikes," "Subscription Bloat," "Food Delivery Addiction").
2. Assign a spending personality.
3. Determine peak spending times and merchant obsessions.
4. Provide a "Surgical Protocol" to optimize their behavioral profile.

Tone: Analytical, behavioral-focused, and authoritative.`,
});

const habitAnalysisFlow = ai.defineFlow(
  {
    name: 'habitAnalysisFlow',
    inputSchema: HabitInputSchema,
    outputSchema: HabitOutputSchema,
  },
  async (input) => {
    const { output } = await habitPrompt(input);
    return output!;
  }
);
