'use server';
/**
 * @fileOverview AI Merchant Categorization Flow.
 * Automatically classifies transaction descriptions into financial sectors.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const CategorizationInputSchema = z.object({
  description: z.string().describe('The transaction description or merchant name (e.g., "Swiggy", "Uber").'),
});

const CategorizationOutputSchema = z.object({
  category: z.enum(['Food', 'Shopping', 'Travel', 'Recharge', 'Electricity', 'Fuel', 'Rent', 'EMI', 'Entertainment', 'Healthcare', 'Salary', 'Freelance', 'Gift', 'Investment', 'Other']),
  confidence: z.number().describe('Confidence score from 0 to 1.'),
  reasoning: z.string().describe('Short explanation of why this category was chosen.'),
});

export async function categorizeTransaction(input: z.infer<typeof CategorizationInputSchema>) {
  return categorizationFlow(input);
}

const categorizationPrompt = ai.definePrompt({
  name: 'categorizationPrompt',
  input: { schema: CategorizationInputSchema },
  output: { schema: CategorizationOutputSchema },
  prompt: `You are the SpendWise Neural Classifier. Your task is to categorize a financial transaction based on its description.

Description: "{{{description}}}"

Rules:
1. Use common Indian and global merchant patterns (e.g., Swiggy/Zomato -> Food, Uber/Ola -> Travel, Amazon/Flipkart -> Shopping).
2. If uncertain, default to "Other" but maintain high confidence if the pattern is recognized.
3. Provide a brief reasoning.`,
});

const categorizationFlow = ai.defineFlow(
  {
    name: 'categorizationFlow',
    inputSchema: CategorizationInputSchema,
    outputSchema: CategorizationOutputSchema,
  },
  async (input) => {
    const { output } = await categorizationPrompt(input);
    return output!;
  }
);
