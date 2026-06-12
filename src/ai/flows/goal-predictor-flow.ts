'use server';
/**
 * @fileOverview AI Manifestation Goal Predictor.
 * Predicts completion dates and success probability for savings goals.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GoalPredictorInputSchema = z.object({
  goals: z.array(z.object({
    title: z.string(),
    targetAmount: z.number(),
    currentAmount: z.number(),
    deadline: z.string().optional().nullable(),
  })),
  monthlySurplus: z.number().describe('Calculated as monthly income - expenses.'),
});

const GoalPredictorOutputSchema = z.object({
  predictions: z.array(z.object({
    goalTitle: z.string(),
    estimatedCompletionDate: z.string(),
    probabilityOfSuccess: z.number().describe('0 to 100'),
    requiredMonthlyIncrease: z.number().describe('Amount needed to hit the original deadline.'),
    status: z.enum(['ON_TRACK', 'DELAYED', 'AT_RISK']),
  })),
  manifestationSummary: z.string().describe('A high-level strategy for hitting all targets.'),
});

export async function predictGoalManifestation(input: z.infer<typeof GoalPredictorInputSchema>) {
  return goalPredictorFlow(input);
}

const goalPrompt = ai.definePrompt({
  name: 'goalPredictorPrompt',
  input: { schema: GoalPredictorInputSchema },
  output: { schema: GoalPredictorOutputSchema },
  prompt: `You are the SpendWise Quantum Strategist. Predict the realization path for the user's financial targets.

CURRENT STATE:
- Monthly Surplus: ₹{{{monthlySurplus}}}

ACTIVE TARGETS:
{{#each goals}}
- {{{title}}}: Target ₹{{{targetAmount}}}, Current ₹{{{currentAmount}}}, Deadline: {{{deadline}}}
{{/each}}

MISSION:
1. Based on the current surplus, calculate the most likely completion date for each goal.
2. If a deadline exists, assess if it's realistic (probability of success).
3. Calculate the exact "Capital Increase" needed per month to hit original deadlines.
4. Categorize each target status (ON_TRACK, DELAYED, AT_RISK).

Tone: Highly accurate, mathematical, and elite.`,
});

const goalPredictorFlow = ai.defineFlow(
  {
    name: 'goalPredictorFlow',
    inputSchema: GoalPredictorInputSchema,
    outputSchema: GoalPredictorOutputSchema,
  },
  async (input) => {
    const { output } = await goalPrompt(input);
    return output!;
  }
);
