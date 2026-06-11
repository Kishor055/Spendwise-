'use server';
/**
 * @fileOverview AI Voice/Natural Language Intent Flow.
 * Converts natural language (e.g., "Spent 200 on lunch") into structured transactions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VoiceIntentInputSchema = z.object({
  text: z.string().describe('The natural language description of an expense or income.'),
});

const VoiceIntentOutputSchema = z.object({
  amount: z.number(),
  type: z.enum(['income', 'expense']),
  category: z.string(),
  note: z.string(),
  isConfidenceHigh: z.boolean()
});

export async function processVoiceIntent(input: z.infer<typeof VoiceIntentInputSchema>) {
  return voiceIntentFlow(input);
}

const voicePrompt = ai.definePrompt({
  name: 'voiceIntentPrompt',
  input: { schema: VoiceIntentInputSchema },
  output: { schema: VoiceIntentOutputSchema },
  prompt: `You are the SpendWise Natural Language Interface. Convert this voice/text command into a structured transaction.

Command: "{{{text}}}"

Rules:
1. Detect if it's an expense (e.g., "spent", "paid") or income (e.g., "got", "received").
2. Extract the amount as a number.
3. Map the intent to a standard SpendWise category.
4. Create a clean note based on the command.`,
});

const voiceIntentFlow = ai.defineFlow(
  {
    name: 'voiceIntentFlow',
    inputSchema: VoiceIntentInputSchema,
    outputSchema: VoiceIntentOutputSchema,
  },
  async (input) => {
    const { output } = await voicePrompt(input);
    return output!;
  }
);
