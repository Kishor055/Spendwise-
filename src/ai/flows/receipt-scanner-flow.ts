'use server';
/**
 * @fileOverview AI Receipt Scanner Flow.
 * Uses Gemini Multi-modal to extract transaction data from images/PDFs.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ReceiptScannerInputSchema = z.object({
  imageUri: z.string().describe("A data URI of the receipt image (base64 encoded)."),
});

const ReceiptScannerOutputSchema = z.object({
  merchant: z.string().describe('Name of the merchant.'),
  amount: z.number().describe('Total amount found on the receipt.'),
  date: z.string().describe('Date of transaction in ISO format.'),
  category: z.enum(['Food', 'Shopping', 'Travel', 'Recharge', 'Electricity', 'Fuel', 'Rent', 'EMI', 'Entertainment', 'Healthcare', 'Other']),
  items: z.array(z.object({
    name: z.string(),
    price: z.number()
  })).optional(),
  confidence: z.number()
});

export async function scanReceipt(input: z.infer<typeof ReceiptScannerInputSchema>) {
  return receiptScannerFlow(input);
}

const receiptPrompt = ai.definePrompt({
  name: 'receiptScannerPrompt',
  input: { schema: ReceiptScannerInputSchema },
  output: { schema: ReceiptScannerOutputSchema },
  prompt: `You are the SpendWise Vision Engine. Analyze this receipt and extract financial metadata.

1. Identify the merchant name clearly.
2. Find the TOTAL amount paid.
3. Extract the date.
4. Categorize it into one of the specified sectors.
5. List the items if they are clearly legible.

Photo: {{media url=imageUri}}`,
});

const receiptScannerFlow = ai.defineFlow(
  {
    name: 'receiptScannerFlow',
    inputSchema: ReceiptScannerInputSchema,
    outputSchema: ReceiptScannerOutputSchema,
  },
  async (input) => {
    const { output } = await receiptPrompt(input);
    return output!;
  }
);
